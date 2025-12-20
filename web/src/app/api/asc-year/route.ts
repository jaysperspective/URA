// web/src/app/api/asc-year/route.ts

import { NextResponse } from "next/server";

/**
 * URA /api/asc-year
 *
 * Ascendant Year Cycle (ANCHOR = natal ASC, MOVER = transiting Sun at as_of_date)
 *
 * MODEL (12 x 30°):
 * - cyclePosition = sepWaxing(natalASC, transitSunLon) in [0,360)
 * - Seasons by quadrant:
 *    0–90   Spring
 *    90–180 Summer
 *    180–270 Fall
 *    270–360 Winter
 * - Sub-phase within each season (three 30° signs):
 *    Cardinal / Fixed / Mutable (in order)
 */

type ParsedInput = {
  birth_datetime: string; // "YYYY-MM-DD HH:MM" (local)
  tz_offset: string; // "-05:00"
  as_of_date: string; // "YYYY-MM-DD" (UTC date)
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

const ASCYEAR_CACHE_VERSION = "asc-year:natal-asc+transit-sun:12x30:v1";
const ASCYEAR_CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6h

type CacheEntry = { expiresAt: number; payload: any };
const ASCYEAR_CACHE: Map<string, CacheEntry> =
  (globalThis as any).__URA_ASCYEAR_CACHE__ ?? new Map<string, CacheEntry>();
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
  if (ASCYEAR_CACHE.size > 1200) {
    const now = Date.now();
    for (const [k, v] of ASCYEAR_CACHE) {
      if (now > v.expiresAt) ASCYEAR_CACHE.delete(k);
      if (ASCYEAR_CACHE.size <= 950) break;
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
      // fall through to text KV
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
  return new Date(Date.UTC(year, month, day, 0, 0, 0)); // 00:00 UTC
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

async function fetchNatalAnchor(birthUTC: Date, lat: number, lon: number) {
  const data = await fetchChartByYMDHM(
    birthUTC.getUTCFullYear(),
    birthUTC.getUTCMonth() + 1,
    birthUTC.getUTCDate(),
    birthUTC.getUTCHours(),
    birthUTC.getUTCMinutes(),
    lat,
    lon
  );

  const asc = data.ascendant;
  const mc = data.mc;
  const houses = data.houses ?? [];
  if (typeof asc !== "number") throw new Error("astro-service missing ascendant (check lat/lon)");
  if (typeof mc !== "number") throw new Error("astro-service missing mc (check lat/lon)");

  return {
    julianDay: data.julianDay,
    asc: wrap360(asc),
    mc: wrap360(mc),
    houses,
  };
}

async function fetchTransitingSun(asOfUTC: Date, lat: number, lon: number) {
  const data = await fetchChartByYMDHM(
    asOfUTC.getUTCFullYear(),
    asOfUTC.getUTCMonth() + 1,
    asOfUTC.getUTCDate(),
    asOfUTC.getUTCHours(),
    asOfUTC.getUTCMinutes(),
    lat,
    lon
  );

  const sunLon = data.planets?.sun?.lon;
  if (typeof sunLon !== "number") throw new Error("astro-service missing sun lon");
  return { julianDay: data.julianDay, sunLon: wrap360(sunLon) };
}

// ------------------------------
// Phase model: 12 x 30°
// ------------------------------

function seasonFromCyclePos(pos: number) {
  const p = wrap360(pos);
  if (p < 90) return "Spring";
  if (p < 180) return "Summer";
  if (p < 270) return "Fall";
  return "Winter";
}

function modalityFromCyclePos(pos: number) {
  const p = wrap360(pos);
  const withinSeason = p % 90; // 0..90
  const idx = Math.floor(withinSeason / 30); // 0,1,2
  const mods = ["Cardinal", "Fixed", "Mutable"] as const;
  return { modality: mods[idx] ?? "Cardinal", segment: idx + 1, total: 3, within: withinSeason % 30 };
}

function boundariesFromAsc(asc: number) {
  // 12 boundaries every 30°
  const b: Record<string, number> = {};
  for (let i = 0; i <= 12; i++) {
    const key = `deg${i * 30}`;
    b[key] = i === 12 ? wrap360(asc) : wrap360(asc + i * 30);
  }
  return b;
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
      throw new Error("Missing lat/lon (required for ascendant).");
    }

    const birthUTC = parseBirthToUTC(input.birth_datetime, input.tz_offset);
    const asOfUTC = parseAsOfToUTCDate(input.as_of_date);

    const cacheKey = `${ASCYEAR_CACHE_VERSION}|birth=${birthUTC.toISOString()}|asof=${asOfUTC.toISOString()}|${lat}|${lon}`;
    const cached = getCache(cacheKey);
    if (cached) return NextResponse.json(cached);

    const natal = await fetchNatalAnchor(birthUTC, lat, lon);
    const transit = await fetchTransitingSun(asOfUTC, lat, lon);

    const cyclePosition = sepWaxing(natal.asc, transit.sunLon); // 0..360
    const season = seasonFromCyclePos(cyclePosition);
    const mod = modalityFromCyclePos(cyclePosition);

    const boundariesLongitude = boundariesFromAsc(natal.asc);

    const lines: string[] = [];
    lines.push("URA • Ascendant Year Cycle");
    lines.push("");
    lines.push(`Birth (local): ${input.birth_datetime}  tz_offset ${input.tz_offset}`);
    lines.push(`Birth (UTC):   ${formatYMDHM(birthUTC)}`);
    lines.push(`As-of (UTC):   ${input.as_of_date} 00:00`);
    lines.push("");
    lines.push(`Natal ASC: ${natal.asc.toFixed(2)}° (${angleToSign(natal.asc)})`);
    lines.push(`Natal MC:  ${natal.mc.toFixed(2)}° (${angleToSign(natal.mc)})`);
    lines.push("");
    lines.push(`Transiting Sun: ${transit.sunLon.toFixed(2)}° (${angleToSign(transit.sunLon)})`);
    lines.push("");
    lines.push(`Cycle position (Sun from ASC): ${cyclePosition.toFixed(2)}°`);
    lines.push(`Season: ${season}`);
    lines.push(`Modality: ${mod.modality} (segment ${mod.segment}/${mod.total})`);
    lines.push(`Degrees into modality: ${mod.within.toFixed(2)}°`);
    lines.push("");
    lines.push("Boundaries (longitude, 30°):");
    for (let i = 0; i <= 12; i++) {
      const label = `${i * 30}°`;
      const key = `deg${i * 30}`;
      lines.push(`- ${label.padEnd(4, " ")} ${boundariesLongitude[key].toFixed(2)}°`);
    }

    const payload = {
      ok: true,
      text: lines.join("\n"),
      input,
      birthUTC: birthUTC.toISOString(),
      asOfUTC: asOfUTC.toISOString(),
      natal: {
        julianDay: natal.julianDay,
        ascendant: natal.asc,
        mc: natal.mc,
        houses: natal.houses,
      },
      transit: {
        julianDay: transit.julianDay,
        sunLon: transit.sunLon,
      },
      ascYear: {
        anchorAsc: natal.asc,
        cyclePosition,
        season,
        modality: mod.modality,
        modalitySegment: `${mod.modality} (segment ${mod.segment}/${mod.total})`,
        degreesIntoModality: mod.within,
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

