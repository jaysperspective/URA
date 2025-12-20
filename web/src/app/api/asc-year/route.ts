// web/src/app/api/asc-year/route.ts

import { NextResponse } from "next/server";

/**
 * URA /api/asc-year
 *
 * Parallel to /api/lunation.
 * Computes an Ascendant Year Cycle snapshot for the progressed date:
 * - progressed date via secondary progression (day-for-a-year)
 * - fetch progressed ASC/MC/houses + progressed Sun lon from astro-service
 * - compute Sun position relative to ASC (0..360)
 * - return raw JSON (for the "raw data box" UI)
 */

type ParsedInput = {
  birth_datetime: string; // "YYYY-MM-DD HH:MM" (local)
  tz_offset: string; // "-05:00"
  as_of_date: string; // "YYYY-MM-DD" (UTC day)
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
    throw new Error("Missing birth_datetime. Example: birth_datetime: 1990-01-24 01:39");
  }
  if (!out.tz_offset) throw new Error("Missing tz_offset. Example: tz_offset: -05:00");
  if (!out.as_of_date) throw new Error("Missing as_of_date. Example: as_of_date: 2025-12-19");

  if (out.lat != null) out.lat = Number(out.lat);
  if (out.lon != null) out.lon = Number(out.lon);

  return out as ParsedInput;
}

async function readInput(req: Request): Promise<ParsedInput> {
  const raw = await req.text();
  const contentType = req.headers.get("content-type") || "";
  const trimmed = raw.trim();
  const looksJson = trimmed.startsWith("{") || trimmed.startsWith("[");

  if (contentType.includes("application/json") || looksJson) {
    try {
      return JSON.parse(raw) as ParsedInput;
    } catch {
      // fall through to text parser
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

function progressedDateUTC(birthUTC: Date, asOfUTC: Date): Date {
  // Secondary progression day-for-a-year
  const msPerDay = 86_400_000;
  const ageDays = (asOfUTC.getTime() - birthUTC.getTime()) / msPerDay;
  return new Date(birthUTC.getTime() + ageDays * msPerDay);
}

// ------------------------------
// Math helpers
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
// Astro-service fetch
// ------------------------------

async function fetchChartByYMDHM(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  lat: number,
  lon: number
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
      latitude: lat,
      longitude: lon,
    }),
  });

  const json = (await res.json()) as AstroServiceChart;
  if (!json.ok) throw new Error(json.error || "astro-service error");
  if (!json.data) throw new Error("astro-service missing data");
  return json.data;
}

async function fetchAscSunAngles(pDateUTC: Date, lat: number, lon: number) {
  const year = pDateUTC.getUTCFullYear();
  const month = pDateUTC.getUTCMonth() + 1;
  const day = pDateUTC.getUTCDate();
  const hour = pDateUTC.getUTCHours();
  const minute = pDateUTC.getUTCMinutes();

  const data = await fetchChartByYMDHM(year, month, day, hour, minute, lat, lon);

  const asc = data.ascendant;
  const mc = data.mc;
  const sunLon = data.planets?.sun?.lon;

  if (typeof asc !== "number") throw new Error("astro-service missing ascendant (check lat/lon)");
  if (typeof mc !== "number") throw new Error("astro-service missing mc (check lat/lon)");
  if (typeof sunLon !== "number") throw new Error("astro-service missing sun lon");

  const houses = Array.isArray(data.houses) ? data.houses.map(wrap360) : [];

  return {
    julianDay: data.julianDay,
    ascendant: wrap360(asc),
    mc: wrap360(mc),
    houses,
    sunLon: wrap360(sunLon),
  };
}

// ------------------------------
// Asc Year Cycle model (raw + stable)
// ------------------------------

function ascYearCycleSnapshot(ascLon: number, sunLon: number) {
  // position of Sun relative to ASC (0..360)
  const pos = sepWaxing(ascLon, sunLon);

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

  const phaseIdx = Math.floor(pos / 45);
  const phase = phases[phaseIdx] || phases[0];

  const withinPhase = pos % 45;
  const segIdx = Math.floor(withinPhase / 15);
  const segLabel = ["Initiation", "Development", "Integration"][segIdx] || "Initiation";

  const segStart = floorTo(withinPhase, 15);
  const segEnd = segStart + 15;

  return {
    anchorAsc: ascLon,
    cyclePosition: pos,
    phase,
    subPhase: `${segLabel} (segment ${segIdx + 1}/3)`,
    degreesIntoPhase: withinPhase,
    subPhaseWindowWithinPhase: { start: segStart, end: segEnd },
    boundariesLongitude: {
      deg0: wrap360(ascLon + 0),
      deg45: wrap360(ascLon + 45),
      deg90: wrap360(ascLon + 90),
      deg135: wrap360(ascLon + 135),
      deg180: wrap360(ascLon + 180),
      deg225: wrap360(ascLon + 225),
      deg270: wrap360(ascLon + 270),
      deg315: wrap360(ascLon + 315),
      deg360: wrap360(ascLon + 360),
    },
  };
}

// ------------------------------
// Route
// ------------------------------

export async function POST(req: Request) {
  try {
    const input = await readInput(req);

    const birthUTC = parseBirthToUTC(input.birth_datetime, input.tz_offset);
    const asOfUTC = parseAsOfToUTCDate(input.as_of_date);
    const pDateUTC = progressedDateUTC(birthUTC, asOfUTC);

    if (typeof input.lat !== "number" || typeof input.lon !== "number") {
      throw new Error("asc-year requires lat and lon");
    }

    const angles = await fetchAscSunAngles(pDateUTC, input.lat, input.lon);
    const cycle = ascYearCycleSnapshot(angles.ascendant, angles.sunLon);

    return NextResponse.json({
      ok: true,
      input,
      progressedDateUTC: pDateUTC.toISOString(),
      progressed: angles,
      ascYear: cycle,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "unknown error" },
      { status: 400 }
    );
  }
}
