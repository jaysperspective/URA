// /var/www/URA/web/src/app/api/lunation/route.ts

import { NextResponse } from "next/server";

/**
 * URA /api/lunation
 *
 * Existing behavior:
 * - secondary progressed Sun/Moon separation (waxing 0..360)
 * - anchored to previous progressed New Moon
 * - returns phase + sub-phase + boundary timestamps
 *
 * New behavior (Step 1):
 * - adds ASC/MC/houses lookup from astro-service for the progressed date
 * - computes Ascendant Year Cycle position (0..360) anchored at ASC
 * - returns 8 phases + 3 sub-phases (15° each) and boundary longitudes
 */

type ParsedInput = {
  birth_datetime: string; // "YYYY-MM-DD HH:MM"
  tz_offset: string; // "-05:00"
  as_of_date: string; // "YYYY-MM-DD"
  // optional location (needed for ASC/houses)
  lat?: number;
  lon?: number;
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
    houses?: number[];
    ascendant?: number | null;
    mc?: number | null;
  };
};

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

  // Optional lat/lon (recommended for year cycle)
  if (out.lat != null) out.lat = Number(out.lat);
  if (out.lon != null) out.lon = Number(out.lon);

  return out as ParsedInput;
}

/**
 * ✅ NEW: Accept BOTH JSON and your text/plain KV format
 */
async function readInput(req: Request): Promise<ParsedInput> {
  const raw = await req.text();
  const contentType = req.headers.get("content-type") || "";
  const trimmed = raw.trim();
  const looksJson = trimmed.startsWith("{") || trimmed.startsWith("[");

  if (contentType.includes("application/json") || looksJson) {
    try {
      return JSON.parse(raw) as ParsedInput;
    } catch {
      // fall through
    }
  }

  return parseTextKV(raw);
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

function floorTo(n: number, step: number) {
  return Math.floor(n / step) * step;
}

// ------------------------------
// Secondary progression utilities
// (keep as you already had them)
// ------------------------------

function parseBirthToUTC(birth_datetime: string, tz_offset: string): Date {
  // birth_datetime is local in tz_offset; convert to UTC Date
  // "YYYY-MM-DD HH:MM"
  const m = birth_datetime.match(
    /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})$/
  );
  if (!m) throw new Error("birth_datetime format must be YYYY-MM-DD HH:MM");

  const year = Number(m[1]);
  const month = Number(m[2]) - 1;
  const day = Number(m[3]);
  const hour = Number(m[4]);
  const minute = Number(m[5]);

  // tz_offset "-05:00"
  const tz = tz_offset.match(/^([+-])(\d{2}):(\d{2})$/);
  if (!tz) throw new Error("tz_offset format must be ±HH:MM");
  const sign = tz[1] === "-" ? -1 : 1;
  const tzh = Number(tz[2]);
  const tzm = Number(tz[3]);
  const offsetMinutes = sign * (tzh * 60 + tzm);

  // Local millis (as if UTC), then subtract offset to get true UTC
  const localMillis = Date.UTC(year, month, day, hour, minute, 0);
  const utcMillis = localMillis - offsetMinutes * 60_000;

  return new Date(utcMillis);
}

function parseAsOfToUTCDate(as_of_date: string): Date {
  // as_of_date "YYYY-MM-DD" treated as 00:00 UTC
  const m = as_of_date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) throw new Error("as_of_date format must be YYYY-MM-DD");
  const year = Number(m[1]);
  const month = Number(m[2]) - 1;
  const day = Number(m[3]);
  return new Date(Date.UTC(year, month, day, 0, 0, 0));
}

function progressedDateUTC(birthUTC: Date, asOfUTC: Date): Date {
  // Secondary progression day-for-a-year:
  // progressed_date = birth_date + (asOf - birth) in days as years -> days
  // You already have this; keep consistent with your existing implementation.
  // NOTE: If you already have a different implementation in your file, keep it.
  const msPerDay = 86_400_000;
  const ageDays = (asOfUTC.getTime() - birthUTC.getTime()) / msPerDay;
  const progressed = new Date(birthUTC.getTime() + ageDays * msPerDay);
  return progressed;
}

// ------------------------------
// Astro-service fetch helpers
// ------------------------------

const ASTRO_URL = process.env.ASTRO_SERVICE_URL || "http://127.0.0.1:3002";

async function fetchChartByYMDHM(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  lat: number,
  lon: number
): Promise<AstroServiceChart["data"]> {
  const res = await fetch(`${ASTRO_URL}/chart`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      year,
      month,
      day,
      hour,
      minute,
      latitude: lat,
      longitude: lon,
    }),
  });

  const json = (await res.json()) as AstroServiceChart;
  if (!json.ok) throw new Error(json.error || "astro-service error");
  if (!json.data) throw new Error("astro-service missing data");
  return json.data;
}

async function fetchSunMoonLongitudes(pDateUTC: Date) {
  // For lunation you don’t need lat/lon; astro-service requires them for houses,
  // but Sun/Moon calc works regardless. Use 0/0 to keep stable.
  const year = pDateUTC.getUTCFullYear();
  const month = pDateUTC.getUTCMonth() + 1;
  const day = pDateUTC.getUTCDate();
  const hour = pDateUTC.getUTCHours();
  const minute = pDateUTC.getUTCMinutes();

  const data = await fetchChartByYMDHM(year, month, day, hour, minute, 0, 0);

  const sunLon = data?.planets?.sun?.lon;
  const moonLon = data?.planets?.moon?.lon;

  if (typeof sunLon !== "number" || typeof moonLon !== "number") {
    throw new Error("astro-service response missing sun/moon lon");
  }

  return { sunLon, moonLon };
}

async function fetchAnglesForProgressedDate(pDateUTC: Date, lat: number, lon: number) {
  const year = pDateUTC.getUTCFullYear();
  const month = pDateUTC.getUTCMonth() + 1;
  const day = pDateUTC.getUTCDate();
  const hour = pDateUTC.getUTCHours();
  const minute = pDateUTC.getUTCMinutes();

  const data = await fetchChartByYMDHM(year, month, day, hour, minute, lat, lon);

  if (typeof data.ascendant !== "number" || typeof data.mc !== "number") {
    throw new Error("astro-service missing ascendant/mc (check lat/lon)");
  }

  const houses = Array.isArray(data.houses) ? data.houses : [];
  return {
    ascendant: wrap360(data.ascendant),
    mc: wrap360(data.mc),
    houses: houses.map(wrap360),
  };
}

// ------------------------------
// Your existing New Moon anchoring logic
// (placeholder: keep your authoritative implementation)
// ------------------------------

async function findPreviousProgressedNewMoonUTC(birthUTC: Date, asOfUTC: Date): Promise<Date> {
  // ✅ KEEP YOUR EXISTING WORKING VERSION HERE.
  throw new Error(
    "findPreviousProgressedNewMoonUTC: replace this stub with your existing verified implementation from route.ts"
  );
}

function phaseLabelFromSep(sep: number) {
  // 8 phases, each 45°
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
  // 3 sub-phases within each 45°: 0-15, 15-30, 30-45
  const within = wrap360(sep) % 45;
  if (within < 15) return "Sub-phase 1";
  if (within < 30) return "Sub-phase 2";
  return "Sub-phase 3";
}

// ------------------------------
// NEW: Ascendant Year Cycle calc
// ------------------------------

function ascYearCycleBlock(asclon: number, sunLon: number) {
  // Personal year: measure the Sun’s position relative to ASC.
  // ASC is 0°, then 45° steps define the 8 seasonal phases.
  const rel = sepWaxing(asclon, sunLon); // (sun - asc) wrapped 0..360

  const phases = [
    "Ascendant Spring",
    "Waxing Gate",
    "First Quarter Rise",
    "High Summer",
    "Descendant Autumn",
    "Waning Gate",
    "Last Quarter Deepening",
    "Winter Seed",
  ];

  const phaseIdx = Math.floor(rel / 45);
  const phase = phases[phaseIdx] || phases[0];

  const within = rel % 45;
  const subPhaseIdx = Math.floor(within / 15); // 0,1,2
  const subPhase =
    ["Sub-phase 1", "Sub-phase 2", "Sub-phase 3"][subPhaseIdx] || "Sub-phase 1";

  const base = floorTo(rel, 15);
  const next = wrap360(base + 15);

  const boundaries = {
    deg0: wrap360(asclon + 0),
    deg45: wrap360(asclon + 45),
    deg90: wrap360(asclon + 90),
    deg135: wrap360(asclon + 135),
    deg180: wrap360(asclon + 180),
    deg225: wrap360(asclon + 225),
    deg270: wrap360(asclon + 270),
    deg315: wrap360(asclon + 315),
    deg360: wrap360(asclon + 360),
  };

  return {
    anchorAsc: asclon,
    cyclePosition: rel, // 0..360
    phase,
    subPhase,
    subPhaseRange: { start: base, end: next },
    boundaries,
  };
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

    // Existing lunation: progressed Sun/Moon at progressed date
    const { sunLon, moonLon } = await fetchSunMoonLongitudes(pDateUTC);
    const separation = sepWaxing(sunLon, moonLon);

    // ✅ YEAR CYCLE (new): requires lat/lon
    let yearCycle: any = null;
    if (typeof input.lat === "number" && typeof input.lon === "number") {
      const angles = await fetchAnglesForProgressedDate(pDateUTC, input.lat, input.lon);
      yearCycle = ascYearCycleBlock(angles.ascendant, sunLon);
    }

    // Existing anchor (use your working function)
    const prevNewMoonUTC = await findPreviousProgressedNewMoonUTC(birthUTC, asOfUTC);

    // Existing phase/sub-phase labels for lunation
    const lunationPhase = phaseLabelFromSep(separation);
    const lunationSubPhase = subPhaseLabelFromSep(separation);

    return NextResponse.json({
      ok: true,
      input,
      progressedDateUTC: pDateUTC.toISOString(),
      progressed: {
        sunLon,
        moonLon,
        separationWaxing: separation,
      },
      lunation: {
        phase: lunationPhase,
        subPhase: lunationSubPhase,
        anchorPrevNewMoonUTC: prevNewMoonUTC.toISOString(),
      },
      yearCycle, // ✅ new block (null if no lat/lon)
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "unknown error" },
      { status: 400 }
    );
  }
}
