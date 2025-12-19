// /var/www/URA/web/src/app/api/lunation/route.ts
// (lunation only; no asc-year logic inside this route)

import { NextResponse } from "next/server";

/**
 * URA /api/lunation
 *
 * Stable behavior:
 * - secondary progressed Sun/Moon separation (waxing 0..360)
 * - anchored to previous progressed New Moon (wrap event 360->0)
 * - returns phase + sub-phase + boundary timestamps (0,45,...,360)
 *
 * NOTE: This file intentionally does NOT compute the Ascendant Year Cycle.
 * That is handled by /api/asc-year in a parallel route.
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

const ASTRO_URL = process.env.ASTRO_SERVICE_URL || "http://127.0.0.1:3002";

// ------------------------------
// Parsing helpers
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

  if (!out.birth_datetime) throw new Error("missing birth_datetime");
  if (!out.tz_offset) throw new Error("missing tz_offset");
  if (!out.as_of_date) throw new Error("missing as_of_date");

  return out as ParsedInput;
}

// ------------------------------
// Core math helpers
// ------------------------------

function wrap360(deg: number) {
  return ((deg % 360) + 360) % 360;
}

// waxing separation from A to B (0..360)
function sepWaxing(a: number, b: number) {
  return wrap360(b - a);
}

// map 0..360 to -180..180 (good for bracketing around conjunction)
function wrap180(deg: number) {
  const w = wrap360(deg);
  return ((w + 180) % 360) - 180;
}

function formatYMD(d: Date) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// ------------------------------
// Secondary progression utilities
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

function progressedDateUTC(birthUTC: Date, asOfUTC: Date): Date {
  const msPerDay = 86_400_000;
  const ageDays = (asOfUTC.getTime() - birthUTC.getTime()) / msPerDay;
  return new Date(birthUTC.getTime() + ageDays * msPerDay);
}

// ------------------------------
// Astro-service fetch helpers
// ------------------------------

async function fetchChartByYMDHM(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number
): Promise<AstroServiceChart["data"]> {
  // Sun/Moon do not require real location; keep stable.
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

  const sunLon = data?.planets?.sun?.lon;
  const moonLon = data?.planets?.moon?.lon;

  if (typeof sunLon !== "number" || typeof moonLon !== "number") {
    throw new Error("astro-service response missing sun/moon lon");
  }

  return { sunLon: wrap360(sunLon), moonLon: wrap360(moonLon) };
}

// ------------------------------
// Lunation model helpers
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
  // 3 segments of 15° inside each 45°
  const within = wrap360(sep) % 45;
  const seg = Math.floor(within / 15); // 0..2
  const label = ["Initiation", "Development", "Integration"][seg] || "Initiation";
  return { label, segment: seg + 1, total: 3, within };
}

// Cached separation calls (reduces astro-service load during boundary bisections)
function makeSepCache(birthUTC: Date) {
  const cache = new Map<number, { sep: number; sunLon: number; moonLon: number }>();

  return async function getAt(asOfUTCms: number) {
    const key = Math.floor(asOfUTCms / 1000) * 1000; // normalize to second
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

// Find the previous progressed new moon (wrap event 360 -> 0) by scanning backwards
async function findPreviousNewMoonUTC(
  birthUTC: Date,
  asOfUTC: Date,
  getAt: (ms: number) => Promise<{ sep: number }>
): Promise<Date> {
  const oneDay = 86_400_000;

  // scan back up to ~80 years (enough margin)
  const maxDaysBack = 80 * 366;

  let t1 = asOfUTC.getTime();
  let s1 = (await getAt(t1)).sep;

  for (let i = 0; i < maxDaysBack; i++) {
    const t0 = t1 - oneDay;
    const s0 = (await getAt(t0)).sep;

    // Wrap signature: yesterday was near 360, today is near 0
    if (s0 > 300 && s1 < 60) {
      // refine inside [t0, t1] by bisection on wrap180(sep)
      let lo = t0;
      let hi = t1;

      const f = async (ms: number) => wrap180((await getAt(ms)).sep);

      let flo = await f(lo);
      let fhi = await f(hi);

      // ensure sign change; if not, still bisect around minimum crossing
      for (let it = 0; it < 28; it++) {
        const mid = Math.floor((lo + hi) / 2);
        const fmid = await f(mid);

        // want root near 0 (conjunction)
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
          // fallback: split toward smaller abs value
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

// Find boundary date where sep reaches targetDeg (0..360) after anchor
async function findBoundaryUTC(
  anchorUTC: Date,
  targetDeg: number,
  getAt: (ms: number) => Promise<{ sep: number }>
): Promise<Date> {
  const oneDay = 86_400_000;

  const anchorMs = anchorUTC.getTime();
  const target = targetDeg;

  // Quick return for 0° boundary
  if (target === 0) return new Date(anchorMs);

  // bracket forward until sep >= target
  let lo = anchorMs;
  let slo = (await getAt(lo)).sep;

  // Start searching from the next day to avoid returning anchor again
  let hi = anchorMs + oneDay;
  let shi = (await getAt(hi)).sep;

  // if anchor is slightly above 0 due to refinement, allow it
  if (slo > target) {
    // move lo back a day
    lo = anchorMs - oneDay;
    slo = (await getAt(lo)).sep;
  }

  // Expand window; progressed cycle lasts decades in as-of time.
  const maxDaysForward = 90 * 366;
  for (let i = 0; i < maxDaysForward && shi < target; i++) {
    lo = hi;
    slo = shi;
    hi = hi + 7 * oneDay; // weekly stepping reduces calls
    shi = (await getAt(hi)).sep;
  }

  if (shi < target) {
    throw new Error(`could not bracket boundary for ${target}° (forward scan exceeded limit)`);
  }

  // bisection on (sep - target)
  for (let it = 0; it < 30; it++) {
    const mid = Math.floor((lo + hi) / 2);
    const smid = (await getAt(mid)).sep;

    if (smid >= target) {
      hi = mid;
      shi = smid;
    } else {
      lo = mid;
      slo = smid;
    }

    // stop if within ~30 minutes
    if (hi - lo < 30 * 60_000) break;
  }

  return new Date(hi);
}

// ------------------------------
// Route handler
// ------------------------------

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";
    const raw = await req.text();

    const input = contentType.includes("application/json")
      ? (JSON.parse(raw) as ParsedInput)
      : parseTextKV(raw);

    const birthUTC = parseBirthToUTC(input.birth_datetime, input.tz_offset);
    const asOfUTC = parseAsOfToUTCDate(input.as_of_date);
    const pDateUTC = progressedDateUTC(birthUTC, asOfUTC);

    const getAt = makeSepCache(birthUTC);

    const { sunLon, moonLon } = await fetchSunMoonLongitudes(pDateUTC);
    const separation = sepWaxing(sunLon, moonLon);

    const phase = phaseLabelFromSep(separation);
    const sub = subPhaseLabelFromSep(separation);

    const prevNewMoonUTC = await findPreviousNewMoonUTC(birthUTC, asOfUTC, getAt);

    // Boundaries for the current progressed lunation cycle
    const boundaryTargets = [0, 45, 90, 135, 180, 225, 270, 315, 360] as const;
    const boundaryLabels = [
      "New Moon",
      "Crescent",
      "First Quarter",
      "Gibbous",
      "Full Moon",
      "Disseminating",
      "Last Quarter",
      "Balsamic",
      "Next New Moon",
    ] as const;

    const boundaries: Array<{ deg: number; label: string; dateUTC: string }> = [];

    // We compute 0..315 from anchor forward; 360 is next wrap, same as next new moon.
    for (let i = 0; i < boundaryTargets.length; i++) {
      const deg = boundaryTargets[i];
      const label = boundaryLabels[i];

      const boundaryDate = await findBoundaryUTC(prevNewMoonUTC, deg === 360 ? 360 : deg, getAt);

      boundaries.push({
        deg,
        label,
        dateUTC: formatYMD(boundaryDate),
      });
    }

    return NextResponse.json({
      ok: true,
      input,
      model: {
        birth_local: `${input.birth_datetime} tz_offset ${input.tz_offset}`,
        birth_utc: birthUTC.toISOString().slice(0, 16).replace("T", " "),
        as_of_utc: input.as_of_date,
        progressed_date_utc: pDateUTC.toISOString(),
        progressed_sun_lon: sunLon,
        progressed_moon_lon: moonLon,
        separation_moon_minus_sun: separation,
        current_phase: phase,
        current_sub_phase: `${sub.label} (segment ${sub.segment}/${sub.total})`,
        degrees_into_phase: sub.within,
        cycle_boundaries: boundaries,
        anchor_prev_new_moon_utc: formatYMD(prevNewMoonUTC),
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "unknown error" },
      { status: 400 }
    );
  }
}
