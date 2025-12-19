// web/src/app/api/lunation/route.ts
import { NextResponse } from "next/server";

function mod360(x: number) {
  const r = x % 360;
  return r < 0 ? r + 360 : r;
}

// signed diff in [-180,180], used to detect conjunction crossing
function signedAngleDiff(a: number, b: number) {
  let d = mod360(a - b);
  if (d > 180) d -= 360;
  return d;
}

// Moon ahead of Sun in waxing measure 0..360
function separationWaxing(moonLon: number, sunLon: number) {
  return mod360(moonLon - sunLon);
}

function parseKeyValueText(text: string) {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const obj: Record<string, string> = {};
  for (const line of lines) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const k = line.slice(0, idx).trim().toLowerCase();
    const v = line.slice(idx + 1).trim();
    obj[k] = v;
  }
  return obj;
}

// tz_offset like "-05:00" or "+02:00"
function parseTzOffsetMinutes(s: string) {
  const m = s.match(/^([+-])(\d{2}):(\d{2})$/);
  if (!m) throw new Error(`Invalid tz_offset: "${s}" (use like -05:00)`);
  const sign = m[1] === "-" ? -1 : 1;
  const hh = Number(m[2]);
  const mm = Number(m[3]);
  return sign * (hh * 60 + mm);
}

function parseLocalDateTimeToUTC(s: string, tzOffsetMinutes: number) {
  const m = s.match(
    /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/
  );
  if (!m) throw new Error(`Invalid birth_datetime: "${s}" (YYYY-MM-DD HH:MM)`);
  const [_, Y, M, D, h, min, sec] = m;
  // local time -> UTC: subtract offset
  const utcMs =
    Date.UTC(
      Number(Y),
      Number(M) - 1,
      Number(D),
      Number(h),
      Number(min),
      sec ? Number(sec) : 0
    ) - tzOffsetMinutes * 60_000;
  return new Date(utcMs);
}

function parseDateUTC(s: string) {
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) throw new Error(`Invalid as_of_date: "${s}" (YYYY-MM-DD)`);
  const [_, Y, M, D] = m;
  return new Date(Date.UTC(Number(Y), Number(M) - 1, Number(D), 0, 0, 0));
}

// Secondary progression: progressedDate = birth + ageYears days
function progressedDateUTC(birthUTC: Date, asOfUTC: Date) {
  const msPerDay = 86400000;
  const ageDays = (asOfUTC.getTime() - birthUTC.getTime()) / msPerDay;
  const ageYears = ageDays / 365.2425;
  return new Date(birthUTC.getTime() + ageYears * msPerDay);
}

function fmtDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

// ---- astro-service bridge (your contract) ----
async function fetchSunMoonLongitudes(progressedUTC: Date) {
  const base = process.env.ASTRO_SERVICE_URL || "http://127.0.0.1:3002";

  const y = progressedUTC.getUTCFullYear();
  const mo = progressedUTC.getUTCMonth() + 1;
  const da = progressedUTC.getUTCDate();
  const hh = progressedUTC.getUTCHours();
  const mm = progressedUTC.getUTCMinutes();

  // astro-service currently requires lat/lon even though stub
  const payload = {
    year: y,
    month: mo,
    day: da,
    hour: hh,
    minute: mm,
    latitude: 0,
    longitude: 0,
  };

  const res = await fetch(`${base.replace(/\/$/, "")}/chart`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.ok !== true) {
    throw new Error(`astro-service /chart failed: ${data?.error ?? "Unknown"}`);
  }

  const sunLon = data?.data?.planets?.sun?.lon;
  const moonLon = data?.data?.planets?.moon?.lon;

  if (typeof sunLon !== "number" || typeof moonLon !== "number") {
    throw new Error("astro-service response missing data.planets.sun.lon/moon.lon");
  }

  return { sunLon, moonLon };
}

async function getSepAtAsOf(birthUTC: Date, asOfUTC: Date) {
  const pDate = progressedDateUTC(birthUTC, asOfUTC);
  const { sunLon, moonLon } = await fetchSunMoonLongitudes(pDate);
  return {
    sunLon,
    moonLon,
    sep: separationWaxing(moonLon, sunLon),
    signed: signedAngleDiff(moonLon, sunLon),
  };
}

// Find nearest conjunction before/after asOf by bracketing signed separation across a zero crossing
async function findConjunctionNear(
  birthUTC: Date,
  centerAsOfUTC: Date,
  direction: -1 | 1
) {
  const stepDays = 180; // coarse step
  const maxSteps = Math.ceil((45 * 365.2425) / stepDays);

  let a = new Date(centerAsOfUTC);
  let prev = await getSepAtAsOf(birthUTC, a);

  for (let i = 0; i < maxSteps; i++) {
    const b = new Date(a.getTime() + direction * stepDays * 86400000);
    const cur = await getSepAtAsOf(birthUTC, b);

    if (prev.signed === 0) return a;
    if (cur.signed === 0) return b;

    if ((prev.signed < 0 && cur.signed > 0) || (prev.signed > 0 && cur.signed < 0)) {
      return await bisectConjunction(birthUTC, a, b);
    }

    a = b;
    prev = cur;
  }

  throw new Error("Could not locate conjunction within search window.");
}

async function bisectConjunction(birthUTC: Date, lo: Date, hi: Date) {
  let loD = new Date(lo);
  let hiD = new Date(hi);

  let loV = (await getSepAtAsOf(birthUTC, loD)).signed;
  let hiV = (await getSepAtAsOf(birthUTC, hiD)).signed;

  if (loV === 0) return loD;
  if (hiV === 0) return hiD;

  for (let i = 0; i < 42; i++) {
    const mid = new Date((loD.getTime() + hiD.getTime()) / 2);
    const midV = (await getSepAtAsOf(birthUTC, mid)).signed;
    if (Math.abs(midV) < 0.05) return mid;

    if ((loV < 0 && midV > 0) || (loV > 0 && midV < 0)) {
      hiD = mid;
      hiV = midV;
    } else {
      loD = mid;
      loV = midV;
    }
  }

  return new Date((loD.getTime() + hiD.getTime()) / 2);
}

async function solveForSeparation(
  birthUTC: Date,
  start: Date,
  end: Date,
  targetDeg: number
) {
  let lo = new Date(start);
  let hi = new Date(end);

  async function value(d: Date) {
    return (await getSepAtAsOf(birthUTC, d)).sep;
  }

  for (let i = 0; i < 46; i++) {
    const mid = new Date((lo.getTime() + hi.getTime()) / 2);
    const v = await value(mid);
    if (Math.abs(v - targetDeg) < 0.05) return mid;
    if (v < targetDeg) lo = mid;
    else hi = mid;
  }

  return new Date((lo.getTime() + hi.getTime()) / 2);
}

const phases = [
  { name: "New Moon", start: 0 },
  { name: "Crescent", start: 45 },
  { name: "First Quarter", start: 90 },
  { name: "Gibbous", start: 135 },
  { name: "Full Moon", start: 180 },
  { name: "Disseminating", start: 225 },
  { name: "Last Quarter", start: 270 },
  { name: "Balsamic", start: 315 },
] as const;

function phaseFromSep(sep: number) {
  // sep in [0,360)
  let phase = "New Moon";
  let start = 0;

  for (let i = phases.length - 1; i >= 0; i--) {
    if (sep >= phases[i].start) {
      phase = phases[i].name;
      start = phases[i].start;
      break;
    }
  }

  const degreesIntoPhase = sep - start; // 0..45
  const subPhaseIndex = Math.min(3, Math.floor(degreesIntoPhase / 15) + 1);

  const map: Record<string, string[]> = {
    "New Moon": ["Seed", "Pull", "Internal Yes"],
    "Crescent": ["Initiation", "Resistance", "Stabilization"],
    "First Quarter": ["Challenge", "Adjustment", "Momentum"],
    "Gibbous": ["Self-Critique", "Correction", "Final Preparation"],
    "Full Moon": ["Exposure", "Integration", "Release"],
    "Disseminating": ["Translation", "Sharing", "Detachment"],
    "Last Quarter": ["Discontent", "Breakdown", "Reclaiming"],
    "Balsamic": ["Withdrawal", "Completion", "Seeded Silence"],
  };

  return {
    phase,
    subPhaseIndex,
    subPhaseName: map[phase][subPhaseIndex - 1],
    degreesIntoPhase,
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const text = String(body?.text ?? "");
    const kv = parseKeyValueText(text);

    const birthStr = kv["birth_datetime"];
    if (!birthStr) {
      return NextResponse.json(
        { error: "Missing birth_datetime. Example: birth_datetime: 1990-01-24 01:39" },
        { status: 400 }
      );
    }

    const tzOffset = kv["tz_offset"] || "-05:00";
    const tzOffsetMinutes = parseTzOffsetMinutes(tzOffset);

    const asOfStr = kv["as_of_date"];
    const asOfUTC = asOfStr ? parseDateUTC(asOfStr) : new Date();

    const birthUTC = parseLocalDateTimeToUTC(birthStr, tzOffsetMinutes);

    const cur = await getSepAtAsOf(birthUTC, asOfUTC);
    const curLabel = phaseFromSep(cur.sep);

    const lastNewMoon = await findConjunctionNear(birthUTC, asOfUTC, -1);
    const nextNewMoon = await findConjunctionNear(birthUTC, asOfUTC, +1);

    const targets = [0, 45, 90, 135, 180, 225, 270, 315, 360] as const;
    const boundaryLines: string[] = [];

    for (const deg of targets) {
      if (deg === 0) boundaryLines.push(`- New Moon (0°): ${fmtDate(lastNewMoon)}`);
      else if (deg === 360) boundaryLines.push(`- Next New Moon (360°): ${fmtDate(nextNewMoon)}`);
      else {
        const d = await solveForSeparation(birthUTC, lastNewMoon, nextNewMoon, deg);
        const phaseName = phases.find((p) => p.start === deg)?.name ?? `Phase ${deg}°`;
        boundaryLines.push(`- ${phaseName} (${deg}°): ${fmtDate(d)}`);
      }
    }

    const lines: string[] = [];
    lines.push("URA • Progressed Lunation Model");
    lines.push("");
    lines.push(`Birth (local): ${birthStr}  tz_offset ${tzOffset}`);
    lines.push(`Birth (UTC):   ${birthUTC.toISOString().replace("T", " ").slice(0, 16)}`);
    lines.push(`As-of (UTC):   ${asOfUTC.toISOString().slice(0, 10)}`);
    lines.push("");
    lines.push(`Progressed Sun lon:  ${cur.sunLon.toFixed(2)}°`);
    lines.push(`Progressed Moon lon: ${cur.moonLon.toFixed(2)}°`);
    lines.push(`Separation (Moon→Sun): ${cur.sep.toFixed(2)}°`);
    lines.push("");
    lines.push(`Current phase: ${curLabel.phase}`);
    lines.push(`Current sub-phase: ${curLabel.subPhaseName} (segment ${curLabel.subPhaseIndex}/3)`);
    lines.push(`Degrees into phase: ${curLabel.degreesIntoPhase.toFixed(2)}°`);
    lines.push("");
    lines.push("Current cycle boundaries:");
    lines.push(...boundaryLines);

    return NextResponse.json({ text: lines.join("\n") });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Unknown error" }, { status: 500 });
  }
}
