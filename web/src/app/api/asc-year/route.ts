// web/src/app/api/asc-year/route.ts

import { NextResponse } from "next/server";

type ParsedInput = {
  birth_datetime: string;
  tz_offset: string;
  as_of_date: string;
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

  if (!out.birth_datetime) throw new Error("missing birth_datetime");
  if (!out.tz_offset) throw new Error("missing tz_offset");
  if (!out.as_of_date) throw new Error("missing as_of_date");

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
 */
function progressedDateUTC(birthUTC: Date, asOfUTC: Date): Date {
  const msPerDay = 86_400_000;
  const elapsedDays = (asOfUTC.getTime() - birthUTC.getTime()) / msPerDay;
  const ageYears = elapsedDays / 365.2425;
  return new Date(birthUTC.getTime() + ageYears * msPerDay);
}

// ------------------------------
// Math helpers
// ------------------------------

function wrap360(deg: number) {
  return ((deg % 360) + 360) % 360;
}

function sepWaxing(a: number, b: number) {
  return wrap360(b - a);
}

function formatYMDHM(d: Date) {
  return d.toISOString().slice(0, 16).replace("T", " ");
}

function angleToSign(deg: number) {
  const signs = [
    "Aries",
    "Taurus",
    "Gemini",
    "Cancer",
    "Leo",
    "Virgo",
    "Libra",
    "Scorpio",
    "Sagittarius",
    "Capricorn",
    "Aquarius",
    "Pisces",
  ];
  const idx = Math.floor(wrap360(deg) / 30);
  return signs[idx] || "Aries";
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
  const houses = data.houses ?? [];
  const sunLon = data.planets?.sun?.lon;

  if (typeof asc !== "number") throw new Error("astro-service missing ascendant (check lat/lon)");
  if (typeof mc !== "number") throw new Error("astro-service missing mc (check lat/lon)");
  if (typeof sunLon !== "number") throw new Error("astro-service missing sun lon");

  return {
    julianDay: data.julianDay,
    asc,
    mc,
    houses,
    sunLon: wrap360(sunLon),
  };
}

// ------------------------------
// Asc-Year model
// ------------------------------

function ascYearPhase(cyclePos: number) {
  // 8 phases of 45° each (name them however you want)
  const idx = Math.floor(wrap360(cyclePos) / 45);
  const phases = [
    "Low Winter",
    "Rising Spring",
    "High Spring",
    "Early Summer",
    "High Summer",
    "Early Fall",
    "High Fall",
    "Deep Winter",
  ];
  return phases[idx] || phases[0];
}

function subPhase(cyclePos: number) {
  const within = wrap360(cyclePos) % 45;
  const seg = Math.floor(within / 15);
  const label = ["Initiation", "Development", "Integration"][seg] || "Initiation";
  return { label, segment: seg + 1, total: 3, within };
}

export async function POST(req: Request) {
  try {
    const input = await readInput(req);

    const lat = typeof input.lat === "number" ? input.lat : undefined;
    const lon = typeof input.lon === "number" ? input.lon : undefined;
    if (lat == null || lon == null) {
      throw new Error("Missing lat/lon (required for ascendant). Example: lat: 36.585 / lon: -79.395");
    }

    const birthUTC = parseBirthToUTC(input.birth_datetime, input.tz_offset);
    const asOfUTC = parseAsOfToUTCDate(input.as_of_date);
    const pDateUTC = progressedDateUTC(birthUTC, asOfUTC);

    const progressed = await fetchAscSunAngles(pDateUTC, lat, lon);

    const cyclePosition = sepWaxing(progressed.asc, progressed.sunLon); // Sun relative to ASC
    const phase = ascYearPhase(cyclePosition);
    const sub = subPhase(cyclePosition);

    const deg0 = progressed.asc;
    const boundariesLongitude = {
      deg0,
      deg45: wrap360(deg0 + 45),
      deg90: wrap360(deg0 + 90),
      deg135: wrap360(deg0 + 135),
      deg180: wrap360(deg0 + 180),
      deg225: wrap360(deg0 + 225),
      deg270: wrap360(deg0 + 270),
      deg315: wrap360(deg0 + 315),
      deg360: deg0,
    };

    const lines: string[] = [];
    lines.push("URA • Ascendant Year Cycle");
    lines.push("");
    lines.push(`Birth (local): ${input.birth_datetime}  tz_offset ${input.tz_offset}`);
    lines.push(`As-of (UTC):   ${input.as_of_date}`);
    lines.push(`Progressed date (UTC): ${formatYMDHM(pDateUTC)}`);
    lines.push("");
    lines.push(`Progressed ASC: ${progressed.asc.toFixed(2)}° (${angleToSign(progressed.asc)})`);
    lines.push(`Progressed MC:  ${progressed.mc.toFixed(2)}° (${angleToSign(progressed.mc)})`);
    lines.push(`Progressed Sun: ${progressed.sunLon.toFixed(2)}° (${angleToSign(progressed.sunLon)})`);
    lines.push("");
    lines.push(`Cycle position (Sun from ASC): ${cyclePosition.toFixed(2)}°`);
    lines.push(`Phase: ${phase}`);
    lines.push(`Sub-phase: ${sub.label} (segment ${sub.segment}/${sub.total})`);
    lines.push(`Degrees into sub-phase: ${sub.within.toFixed(2)}°`);
    lines.push("");
    lines.push("Boundaries (longitude):");
    lines.push(`- 0°:   ${boundariesLongitude.deg0.toFixed(2)}°`);
    lines.push(`- 45°:  ${boundariesLongitude.deg45.toFixed(2)}°`);
    lines.push(`- 90°:  ${boundariesLongitude.deg90.toFixed(2)}°`);
    lines.push(`- 135°: ${boundariesLongitude.deg135.toFixed(2)}°`);
    lines.push(`- 180°: ${boundariesLongitude.deg180.toFixed(2)}°`);
    lines.push(`- 225°: ${boundariesLongitude.deg225.toFixed(2)}°`);
    lines.push(`- 270°: ${boundariesLongitude.deg270.toFixed(2)}°`);
    lines.push(`- 315°: ${boundariesLongitude.deg315.toFixed(2)}°`);
    lines.push(`- 360°: ${boundariesLongitude.deg360.toFixed(2)}°`);

    return NextResponse.json({
      ok: true,
      text: lines.join("\n"), // ✅ clean display
      input,
      progressedDateUTC: pDateUTC.toISOString(),
      progressed: {
        julianDay: progressed.julianDay,
        ascendant: progressed.asc,
        mc: progressed.mc,
        houses: progressed.houses,
        sunLon: progressed.sunLon,
      },
      ascYear: {
        anchorAsc: progressed.asc,
        cyclePosition,
        phase,
        subPhase: `${sub.label} (segment ${sub.segment}/${sub.total})`,
        degreesIntoPhase: sub.within,
        boundariesLongitude,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "unknown error" },
      { status: 400 }
    );
  }
}

