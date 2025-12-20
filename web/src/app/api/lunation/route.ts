// /var/www/URA/web/src/app/api/lunation/route.ts

import { NextResponse } from "next/server";

/**
 * URA /api/lunation
 *
 * Output:
 * - returns { ok: true, text: string }
 *
 * Internals:
 * - secondary progressed Sun/Moon separation (waxing 0..360)
 * - anchor to previous progressed New Moon (wrap event 360->0)
 * - boundaries for 0..315 via sep>=deg, and 360 via next wrap-crossing (next new moon)
 *
 * Accepts:
 * - text/plain KV
 * - application/json direct KV
 * - application/json wrapper: { text: "birth_datetime: ...\n..." }
 */

type ParsedInput = {
  birth_datetime: string; // "YYYY-MM-DD HH:MM"
  tz_offset: string; // "-05:00"
  as_of_date: string; // "YYYY-MM-DD"
};

type AstroServiceChart = {
  ok: boolean;
  error?: string;
  data?: {
    julianDay: number;
    planets: {
      sun?: { lon: number };
      moon?: { lon: number };
    };
  };
};

type AstroServiceData = NonNullable<AstroServiceChart["data"]>;

const ASTRO_URL = process.env.ASTRO_SERVICE_URL || "http://127.0.0.1:3002";

// ------------------------------
// Parsing
// ------------------------------

function parseTextKV(body: string): ParsedInput {
  const lines = body
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const out: any = {};
  for (const line of lines) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const val = line.slice(idx + 1).trim();
    out[key] = val;
  }

  if (!out.birth_datetime) {
    throw new Error(
      "Missing birth_datetime. Example: birth_datetime: 1990-01-24 01:39"
    );
  }
  if (!out.tz_offset)
    throw new Error("Missing tz_offset. Example: tz_offset: -05:00");
  if (!out.as_of_date)
    throw new Error("Missing as_of_date. Example: as_of_date: 2025-12-19");

  return out as ParsedInput;
}

async function readInput(req: Request): Promise<ParsedInput> {
  const raw = await req.text();
  const contentType = req.headers.get("content-type") || "";
  const trimmed = raw.trim();
  const looksJson = trimmed.startsWith("{") || trimmed.startsWith("[");

  if (contentType.includes("application/json") || looksJson) {
    try {
      const obj = JSON.parse(raw) as any;
      if (obj && typeof obj === "object" && typeof obj.text === "string") {
        return parseTextKV(obj.text);
      }
      return obj as ParsedInput;
    } catch {
      // fall through
    }
  }

  return parseTextKV(raw);
}

// ------------------------------
// Time helpers
// ------------------------------

function parseBirthToUTC(birth_datetime: string, tz_offset: string): Date {
  const m = birth_datetime.match(
    /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})$/
  );
  if (!m) throw new Error("birth_datetime format must be YYYY-MM-DD HH:MM");

  const year = Number(m[1]);
  const month = Number(m[2]) - 1;
  const day = Number(m[3]);
  const hour = Number(m[4]);
  const minute = Number(m[5]);

  const tz = tz_offset.match(/^([+-])(\d{2}):(\d{2})$/);
  if (!tz) throw new Error("tz_offset format must be ±HH:MM");
  const sign = tz[1] === "-" ? -1 : 1;
  const tzh = Number(tz[2]);
  const tzm = Number(tz[3]);
  const offsetMinutes = sign * (tzh * 60 + tzm);

  const localMillis = Date.UTC(year, month, day, hour, minute, 0);
  const utcMillis = localMillis - offsetMinutes * 60_000;

  return new Date(utcMillis);
}

function parseAsOfToUTCDate(as_of_date: string): Date {
  const m = as_of_date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) throw new Error("as_of_date format must be YYYY-MM-DD");
  const year = Number(m[1]);
  const month = Number(m[2]) - 1;
  const day = Number(m[3]);
  return new Date(Date.UTC(year, month, day, 0, 0, 0));
}

/**
 * ✅ Correct secondary progression: day-for-year.
 * progressed_date = birthUTC + ageYears days
 */
function progressedDateUTC(birthUTC: Date, asOfUTC: Date): Date {
  const msPerDay = 86_400_000;
  const elapsedDays = (asOfUTC.getTime() - birthUTC.getTime()) / msPerDay;
  const ageYears = elapsedDays / 365.2425;
  const progressedDays = ageYears;
  return new Date(birthUTC.getTime() + progressedDays * msPerDay);
}

// ------------------------------
// Math helpers
// ------------------------------

function wrap360(deg: number) {
  return ((deg % 360) + 360) % 360;
}

function wrap180(deg: number) {
  const w = wrap360(deg);
  return ((w + 180) % 360) - 180;
}

function sepWaxing(a: number, b: number) {
  return wrap360(b - a);
}

function formatYMD(d: Date) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// ------------------------------
// Astro-service fetch
// ------------------------------

async function fetchChartByYMDHM(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number
): Promise<AstroServiceData> {
  const res = await fetch(`${ASTRO_URL}/chart`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      year,
      month,
      day,
      hour,
      minute,
      latitude: 0,
      longitude: 0,
    }),
  });

  const json = (await res.json()) as AstroServiceChart;
  if (!json.ok) throw new Error(json.error || "astro-service error");
  if (!json.data) throw new Error("astro-service missing data");
  return json.data;
}

async function fetchSunMoonLongitudes(pDateUTC: Date) {
  const year = pDateUTC.getUTCFullYear();
  const month = pDateUTC.getUTCMonth() + 1;
  const day = pDateUTC.getUTCDate();
  const hour = pDateUTC.getUTCHours();
  const minute = pDateUTC.getUTCMinutes();

  const data = await fetchChartByYMDHM(year, month, day, hour, minute);

  const sunLon = data.planets?.sun?.lon;
  const moonLon = data.planets?.moon?.lon;

  if (typeof sunLon !== "number" || typeof moonLon !== "number") {
    throw new Error("astro-service response missing sun/moon lon");
  }

  return { sunLon: wrap360(sunLon), moonLon: wrap360(moonLon) };
}

// ------------------------------
// Model helpers
// ------------------------------

function phaseLabelFromSep(sep: number) {
  const phases = [
    "New Moon",
    "Crescent",
    "First Quarter",
    "Gibbous",
    "Full Moon",
    "Disseminating",
    "Last Quarter",
    "Balsamic",
  ];
  const idx = Math.floor(wrap360(sep) / 45);
  return phases[idx] || phases[0];
}

function subPhaseLabelFromSep(sep: number) {
  const within = wrap360(sep) % 45;
  const seg = Math.floor(within / 15);
  const label = ["Initiation", "Development", "Integration"][seg] || "Initiation";
  return { label, segment: seg + 1, total: 3, within };
}

function makeSepCache(birthUTC: Date) {
  const cache = new Map<number, { sep: number; sunLon: number; moonLon: number }>();
  return async (asOfUTCms: number) => {
    const key = Math.floor(asOfUTCms / 1000) * 1000;
    const hit = cache.get(key);
    if (hit) return hit;

    const asOfUTC = new Date(asOfUTCms);
    const pDateUTC = progressedDateUTC(birthUTC, asOfUTC);
    const { sunLon, moonLon } = await fetchSunMoonLongitudes(pDateUTC);
    const sep = sepWaxing(sunLon, moonLon);

    const v = { sep, sunLon, moonLon };
    cache.set(key, v);
    return v;
  };
}

async function findPreviousNewMoonUTC(
  asOfUTC: Date,
  getAt: (ms: number) => Promise<{ sep: number }>
): Promise<Date> {
  const oneDay = 86_400_000;
  const maxDaysBack = 80 * 366;

  let t1 = asOfUTC.getTime();
  let s1 = (await getAt(t1)).sep;

  for (let i = 0; i < maxDaysBack; i++) {
    const t0 = t1 - oneDay;
    const s0 = (await getAt(t0)).sep;

    if (s0 > 300 && s1 < 60) {
      let lo = t0;
      let hi = t1;

      const f = async (ms: number) => wrap180((await getAt(ms)).sep);
      let flo = await f(lo);
      let fhi = await f(hi);

      for (let it = 0; it < 28; it++) {
        const mid = Math.floor((lo + hi) / 2);
        const fmid = await f(mid);

        if (Math.abs(fmid) < 1e-6) {
          lo = hi = mid;
          break;
        }

        if (flo <= 0 && fmid >= 0) {
          hi = mid;
          fhi = fmid;
        } else if (fmid <= 0 && fhi >= 0) {
          lo = mid;
          flo = fmid;
        } else {
          if (Math.abs(flo) < Math.abs(fhi)) hi = mid;
          else lo = mid;
        }
      }

      return new Date(Math.floor((lo + hi) / 2));
    }

    t1 = t0;
    s1 = s0;
  }

  throw new Error("could not locate previous progressed new moon (scan exceeded limit)");
}

async function findNextNewMoonUTC(
  startUTC: Date,
  getAt: (ms: number) => Promise<{ sep: number }>
): Promise<Date> {
  const oneDay = 86_400_000;
  const maxDaysForward = 80 * 366;

  let t0 = startUTC.getTime();
  let s0 = (await getAt(t0)).sep;

  for (let i = 0; i < maxDaysForward; i++) {
    const t1 = t0 + oneDay;
    const s1 = (await getAt(t1)).sep;

    if (s0 > 300 && s1 < 60) {
      let lo = t0;
      let hi = t1;

      const f = async (ms: number) => wrap180((await getAt(ms)).sep);
      let flo = await f(lo);
      let fhi = await f(hi);

      for (let it = 0; it < 28; it++) {
        const mid = Math.floor((lo + hi) / 2);
        const fmid = await f(mid);

        if (Math.abs(fmid) < 1e-6) {
          lo = hi = mid;
          break;
        }

        if (flo <= 0 && fmid >= 0) {
          hi = mid;
          fhi = fmid;
        } else if (fmid <= 0 && fhi >= 0) {
          lo = mid;
          flo = fmid;
        } else {
          if (Math.abs(flo) < Math.abs(fhi)) hi = mid;
          else lo = mid;
        }
      }

      return new Date(Math.floor((lo + hi) / 2));
    }

    t0 = t1;
    s0 = s1;
  }

  throw new Error("could not locate next progressed new moon (scan exceeded limit)");
}

async function findBoundaryUTC(
  anchorUTC: Date,
  targetDeg: number,
  getAt: (ms: number) => Promise<{ sep: number }>
): Promise<Date> {
  const oneDay = 86_400_000;
  if (targetDeg === 0) return new Date(anchorUTC.getTime());

  let lo = anchorUTC.getTime();
  let hi = lo + oneDay;

  let shi = (await getAt(hi)).sep;

  const maxDaysForward = 90 * 366;
  for (let i = 0; i < maxDaysForward && shi < targetDeg; i++) {
    lo = hi;
    hi = hi + 7 * oneDay;
    shi = (await getAt(hi)).sep;
  }

  if (shi < targetDeg) {
    throw new Error(
      `could not bracket boundary for ${targetDeg}° (forward scan exceeded limit)`
    );
  }

  for (let it = 0; it < 30; it++) {
    const mid = Math.floor((lo + hi) / 2);
    const smid = (await getAt(mid)).sep;

    if (smid >= targetDeg) hi = mid;
    else lo = mid;

    if (hi - lo < 30 * 60_000) break;
  }

  return new Date(hi);
}

// ------------------------------
// Route handler
// ------------------------------

export async function POST(req: Request) {
  try {
    const input = await readInput(req);

    const birthUTC = parseBirthToUTC(input.birth_datetime, input.tz_offset);
    const asOfUTC = parseAsOfToUTCDate(input.as_of_date);
    const pDateUTC = progressedDateUTC(birthUTC, asOfUTC);

    const getAt = makeSepCache(birthUTC);

    const { sunLon, moonLon } = await fetchSunMoonLongitudes(pDateUTC);
    const separation = sepWaxing(sunLon, moonLon);

    const phase = phaseLabelFromSep(separation);
    const sub = subPhaseLabelFromSep(separation);

    const prevNewMoonUTC = await findPreviousNewMoonUTC(asOfUTC, getAt);

    const boundaryTargets = [0, 45, 90, 135, 180, 225, 270, 315] as const;
    const boundaryLabels = [
      "New Moon (0°)",
      "Crescent (45°)",
      "First Quarter (90°)",
      "Gibbous (135°)",
      "Full Moon (180°)",
      "Disseminating (225°)",
      "Last Quarter (270°)",
      "Balsamic (315°)",
    ] as const;

    const lines: string[] = [];
    lines.push("URA • Progressed Lunation Model");
    lines.push("");
    lines.push(`Birth (local): ${input.birth_datetime}  tz_offset ${input.tz_offset}`);
    lines.push(`Birth (UTC):   ${birthUTC.toISOString().slice(0, 16).replace("T", " ")}`);
    lines.push(`As-of (UTC):   ${input.as_of_date}`);
    lines.push("");
    lines.push(`Progressed date (UTC): ${pDateUTC.toISOString().slice(0, 16).replace("T", " ")}`);
    lines.push("");
    lines.push(`Progressed Sun lon:  ${sunLon.toFixed(2)}°`);
    lines.push(`Progressed Moon lon: ${moonLon.toFixed(2)}°`);
    lines.push(`Separation (Moon→Sun): ${separation.toFixed(2)}°`);
    lines.push("");
    lines.push(`Current phase: ${phase}`);
    lines.push(`Current sub-phase: ${sub.label} (segment ${sub.segment}/${sub.total})`);
    lines.push(`Degrees into phase: ${sub.within.toFixed(2)}°`);
    lines.push("");
    lines.push("Current cycle boundaries:");

    for (let i = 0; i < boundaryTargets.length; i++) {
      const deg = boundaryTargets[i];
      const label = boundaryLabels[i];
      const d = await findBoundaryUTC(prevNewMoonUTC, deg, getAt);
      lines.push(`- ${label}: ${formatYMD(d)}`);
    }

    const nextNM = await findNextNewMoonUTC(asOfUTC, getAt);
    lines.push(`- Next New Moon (360°): ${formatYMD(nextNM)}`);

    return NextResponse.json({ ok: true, text: lines.join("\n") });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "unknown error" },
      { status: 400 }
    );
  }
}
