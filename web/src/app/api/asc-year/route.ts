// web/src/app/api/asc-year/route.ts

import { NextResponse } from "next/server";

/**
 * URA /api/asc-year
 *
 * NATAL Ascendant Year Cycle (anchor = natal ASC)
 * - Computes natal ASC/MC/houses + natal Sun longitude (requires lat/lon)
 * - Computes position of natal Sun relative to natal ASC (0..360)
 * - Returns both raw JSON + a clean `text` block for the UI
 *
 * Notes:
 * - We still accept as_of_date in input (because the /lunation page sends it),
 *   but it is NOT used for natal ASC-year. It's ignored.
 */

type ParsedInput = {
  birth_datetime: string; // "YYYY-MM-DD HH:MM" (local)
  tz_offset: string; // "-05:00"
  as_of_date?: string; // ignored for natal asc-year
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
// Cache (in-memory)
// ------------------------------

const ASCYEAR_CACHE_VERSION = "asc-year:natal:v1"; // bumped because behavior changed
const ASCYEAR_CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6h

type CacheEntry = { expiresAt: number; payload: any };
const ASCYEAR_CACHE: Map<string, CacheEntry> =
  (globalThis as any).__URA_ASCYEAR_CACHE__ ??
  new Map<string, CacheEntry>();

(globalThis as any).__URA_ASCYEAR_CACHE__ = ASCYEAR_CACHE;

function getCache(key: string) {
  const hit = ASCYEAR_CACHE.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) {
    ASCYEAR_CACHE.delete(key);
    return null;
  }
  return hit.payload;
}

function setCache(key: string, payload: any) {
  // light pruning
  if (ASCYEAR_CACHE.size > 500) {
    const now = Date.now();
    for (const [k, v] of ASCYEAR_CACHE) {
      if (now > v.expiresAt) ASCYEAR_CACHE.delete(k);
      if (ASCYEAR_CACHE.size <= 400) break;
    }
  }
  ASCYEAR_CACHE.set(key, { expiresAt: Date.now() + ASCYEAR_CACHE_TTL_MS, payload });
}

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
  // as_of_date may exist (from /lunation UI) but is optional here

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

function formatYMDHM(d: Date) {
  return d.toISOString().slice(0, 16).replace("T", " ");
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

async function fetchNatalAscSunAngles(birthUTC: Date, lat: number, lon: number) {
  const year = birthUTC.getUTCFullYear();
  const month = birthUTC.getUTCMonth() + 1;
  const day = birthUTC.getUTCDate();
  const hour = birthUTC.getUTCHours();
  const minute = birthUTC.getUTCMinutes();

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
// Asc-Year model (natal anchor)
// ------------------------------

function ascYearPhase(cyclePos: number) {
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

// ------------------------------
// Route handler
// ------------------------------

export async function POST(req: Request) {
  try {
    const input = await readInput(req);

    const lat = typeof input.lat === "number" ? input.lat : undefined;
    const lon = typeof input.lon === "number" ? input.lon : undefined;
    if (lat == null || lon == null) {
      throw new Error(
        "Missing lat/lon (required for ascendant). Example: lat: 36.585 / lon: -79.395"
      );
    }

    const birthUTC = parseBirthToUTC(input.birth_datetime, input.tz_offset);

    // Cache is independent of as_of_date because this is NATAL-only.
    const cacheKey = `${ASCYEAR_CACHE_VERSION}|${birthUTC.toISOString()}|${input.tz_offset}|${lat}|${lon}`;
    const cached = getCache(cacheKey);
    if (cached) return NextResponse.json(cached);

    const natal = await fetchNatalAscSunAngles(birthUTC, lat, lon);

    const cyclePosition = sepWaxing(natal.asc, natal.sunLon);
    const phase = ascYearPhase(cyclePosition);
    const sub = subPhase(cyclePosition);

    const deg0 = natal.asc;
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
    lines.push(`Birth (UTC):   ${formatYMDHM(birthUTC)}`);
    lines.push("");
    lines.push(`Natal ASC: ${natal.asc.toFixed(2)}° (${angleToSign(natal.asc)})`);
    lines.push(`Natal MC:  ${natal.mc.toFixed(2)}° (${angleToSign(natal.mc)})`);
    lines.push(`Natal Sun: ${natal.sunLon.toFixed(2)}° (${angleToSign(natal.sunLon)})`);
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

    const payload = {
      ok: true,
      text: lines.join("\n"),
      input,
      birthUTC: birthUTC.toISOString(),
      natal: {
        julianDay: natal.julianDay,
        ascendant: natal.asc,
        mc: natal.mc,
        houses: natal.houses,
        sunLon: natal.sunLon,
      },
      ascYear: {
        anchorAsc: natal.asc,
        cyclePosition,
        phase,
        subPhase: `${sub.label} (segment ${sub.segment}/${sub.total})`,
        degreesIntoPhase: sub.within,
        boundariesLongitude,
      },
    };

    setCache(cacheKey, payload);
    return NextResponse.json(payload);
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "unknown error" },
      { status: 400 }
    );
  }
}
