// web/src/app/api/core/route.ts

import { NextRequest, NextResponse } from "next/server";
import { withComputeRateLimit } from "@/lib/withRateLimit";

/**
 * URA /api/core
 * Fast, resilient endpoint that returns:
 * - natal chart (angles + houses + bodies)
 * - asOf chart (angles + houses + bodies)
 * - derived: ascYear + lunation
 *
 * IMPORTANT:
 * - Asc-Year requires lat/lon (ASC).
 * - Lunation "quick" mode is default (no boundary scans).
 * - Full lunation boundaries are opt-in via includeBoundaries/detail:"full".
 */

type ParsedInput = {
  birth_datetime: string; // "YYYY-MM-DD HH:MM" (local)
  tz_offset: string; // "-05:00"
  as_of_date: string; // "YYYY-MM-DD" (UTC date)
  lat?: number;
  lon?: number;

  includeBoundaries?: boolean;
  detail?: "quick" | "full";
};

type AstroServiceChart = {
  ok: boolean;
  error?: string;
  data?: {
    julianDay: number;
    planets: Record<string, { lon: number; lat?: number; speed?: number } | undefined>;
    houses?: number[];
    ascendant?: number | null;
    mc?: number | null;
  };
};

type AstroServiceData = NonNullable<AstroServiceChart["data"]>;

const ASTRO_URL = process.env.ASTRO_SERVICE_URL || "http://127.0.0.1:3002";
const ASTRO_TIMEOUT_MS = Number(process.env.ASTRO_TIMEOUT_MS || 9000);

// Lunation FULL scan tuning (safe defaults)
const FULL_SCAN_MAX_YEARS = Number(process.env.URA_LUNATION_FULL_MAX_YEARS || 40); // bounded
const FULL_SCAN_STEP_DAYS = Number(process.env.URA_LUNATION_FULL_STEP_DAYS || 7); // coarse scan step
const FULL_BOUNDARY_STEP_DAYS = Number(process.env.URA_LUNATION_BOUNDARY_STEP_DAYS || 2); // bracket step for boundaries
const LUNATION_TIME_BUDGET_MS = Number(process.env.URA_LUNATION_TIME_BUDGET_MS || 25_000); // max time for full lunation calc

// ------------------------------
// Parsing
// ------------------------------

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function toNum(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

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

  if (out.includeBoundaries != null) out.includeBoundaries = String(out.includeBoundaries).toLowerCase() === "true";
  if (out.detail != null) out.detail = String(out.detail);

  return out as ParsedInput;
}

/**
 * Compute a ±HH:MM offset string for an IANA timezone at a given local datetime.
 * Uses Intl timeZoneName "shortOffset" available in Node 20.
 */
function tzOffsetForZoneAtLocal(
  timeZone: string,
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number
): string {
  const anchorUTC = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "shortOffset",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(anchorUTC);

  const tzPart = parts.find((p) => p.type === "timeZoneName")?.value || "";
  const m = tzPart.match(/([+-])(\d{1,2})(?::(\d{2}))?/);
  if (!m) return "+00:00";

  const sign = m[1];
  const hh = Number(m[2]);
  const mm = m[3] ? Number(m[3]) : 0;

  return `${sign}${pad2(hh)}:${pad2(mm)}`;
}

function normalizeJsonToParsedInput(obj: any): ParsedInput {
  // Legacy ParsedInput
  if (
    obj &&
    typeof obj === "object" &&
    typeof obj.birth_datetime === "string" &&
    typeof obj.tz_offset === "string" &&
    typeof obj.as_of_date === "string"
  ) {
    const lat = toNum(obj.lat ?? obj.latitude);
    const lon = toNum(obj.lon ?? obj.longitude);

    const includeBoundaries =
      typeof obj.includeBoundaries === "boolean"
        ? obj.includeBoundaries
        : typeof obj.include_boundaries === "boolean"
        ? obj.include_boundaries
        : undefined;

    const detail = obj.detail === "full" || obj.detail === "quick" ? obj.detail : undefined;

    return {
      birth_datetime: obj.birth_datetime,
      tz_offset: obj.tz_offset,
      as_of_date: obj.as_of_date,
      lat: lat ?? undefined,
      lon: lon ?? undefined,
      includeBoundaries,
      detail,
    };
  }

  // URA structured contract
  const year = toNum(obj?.year);
  const month = toNum(obj?.month);
  const day = toNum(obj?.day);
  const hour = toNum(obj?.hour);
  const minute = toNum(obj?.minute);

  const lat = toNum(obj?.lat ?? obj?.latitude);
  const lon = toNum(obj?.lon ?? obj?.longitude);

  const asOf =
    (typeof obj?.asOfDate === "string" && obj.asOfDate) ||
    (typeof obj?.as_of_date === "string" && obj.as_of_date) ||
    null;

  const tzOffset =
    (typeof obj?.tz_offset === "string" && obj.tz_offset) ||
    (typeof obj?.tzOffset === "string" && obj.tzOffset) ||
    null;

  const timezone = typeof obj?.timezone === "string" ? obj.timezone : null;

  const includeBoundaries =
    typeof obj?.includeBoundaries === "boolean"
      ? obj.includeBoundaries
      : typeof obj?.include_boundaries === "boolean"
      ? obj.include_boundaries
      : undefined;

  const detail = obj?.detail === "full" || obj?.detail === "quick" ? obj.detail : undefined;

  if (
    typeof year !== "number" ||
    typeof month !== "number" ||
    typeof day !== "number" ||
    typeof hour !== "number" ||
    typeof minute !== "number"
  ) {
    throw new Error(
      "missing birth inputs (expected birth_datetime/tz_offset/as_of_date OR year/month/day/hour/minute + (tz_offset or timezone))"
    );
  }

  const birth_datetime = `${year}-${pad2(month)}-${pad2(day)} ${pad2(hour)}:${pad2(minute)}`;

  const as_of_date =
    asOf ??
    (() => {
      const now = new Date();
      const y = now.getUTCFullYear();
      const m = pad2(now.getUTCMonth() + 1);
      const d = pad2(now.getUTCDate());
      return `${y}-${m}-${d}`;
    })();

  const finalTzOffset =
    tzOffset ??
    (timezone ? tzOffsetForZoneAtLocal(timezone, year, month, day, hour, minute) : null);

  if (!finalTzOffset) throw new Error("missing tz_offset (provide tz_offset or timezone)");

  return {
    birth_datetime,
    tz_offset: finalTzOffset,
    as_of_date,
    lat: lat ?? undefined,
    lon: lon ?? undefined,
    includeBoundaries,
    detail,
  };
}

async function readInput(req: Request): Promise<ParsedInput> {
  const raw = await req.text();
  const contentType = req.headers.get("content-type") || "";
  const trimmed = raw.trim();
  const looksJson = trimmed.startsWith("{") || trimmed.startsWith("[");

  if (contentType.includes("application/json") || looksJson) {
    try {
      const obj = JSON.parse(raw) as any;
      if (obj && typeof obj === "object" && typeof obj.text === "string") return parseTextKV(obj.text);
      return normalizeJsonToParsedInput(obj);
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
  const m = birth_datetime.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})$/);
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

function wrap180(deg: number) {
  const w = wrap360(deg);
  return ((w + 180) % 360) - 180;
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
// Summary helpers
// ------------------------------

function signLabel(deg: number | null | undefined) {
  if (typeof deg !== "number" || !Number.isFinite(deg)) return null;
  return angleToSign(deg);
}

function fmtDeg(deg: number | null | undefined, digits = 2) {
  if (typeof deg !== "number" || !Number.isFinite(deg)) return null;
  return Number(wrap360(deg).toFixed(digits));
}

function buildDerivedSummary(params: { natal: any; asOf: any; ascYear: any; lunation: any }) {
  const { natal, asOf, ascYear, lunation } = params;

  const natalAsc = fmtDeg(natal?.ascendant);
  const natalMc = fmtDeg(natal?.mc);
  const asOfSun = fmtDeg(asOf?.bodies?.sun?.lon);

  const aySeason = typeof ascYear?.season === "string" ? ascYear.season : null;
  const ayModality = typeof ascYear?.modality === "string" ? ascYear.modality : null;
  const ascYearLabel = aySeason && ayModality ? `${aySeason} · ${ayModality}` : aySeason || ayModality || null;

  const lunPhase = typeof lunation?.phase === "string" ? lunation.phase : null;
  const lunSub = typeof lunation?.subPhase?.label === "string" ? lunation.subPhase.label : null;
  const lunationLabel = lunPhase && lunSub ? `${lunPhase} · ${lunSub}` : lunPhase || lunSub || null;

  return {
    ascYearLabel,
    ascYearCyclePos: fmtDeg(ascYear?.cyclePosition),
    ascYearDegreesInto: fmtDeg(ascYear?.degreesIntoModality),
    lunationLabel,
    lunationSeparation: fmtDeg(lunation?.separation),
    natal: {
      asc: natalAsc,
      ascSign: signLabel(natalAsc),
      mc: natalMc,
      mcSign: signLabel(natalMc),
    },
    asOf: {
      sun: asOfSun,
      sunSign: signLabel(asOfSun),
    },
  };
}

// ------------------------------
// Astro-service fetch (with timeout)
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
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), ASTRO_TIMEOUT_MS);

  try {
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
      signal: controller.signal,
    });

    const json = (await res.json()) as AstroServiceChart;
    if (!json.ok) throw new Error(json.error || "astro-service error");
    if (!json.data) throw new Error("astro-service missing data");
    return json.data;
  } catch (e: any) {
    const msg =
      e?.name === "AbortError"
        ? `astro-service timeout after ${ASTRO_TIMEOUT_MS}ms`
        : e?.message || "astro-service fetch failed";
    throw new Error(msg);
  } finally {
    clearTimeout(t);
  }
}

function readPlanetLon(data: AstroServiceData, key: string): number | null {
  const p = data.planets?.[key];
  if (!p || typeof p.lon !== "number") return null;
  return wrap360(p.lon);
}

function readFirstPlanetLon(data: AstroServiceData, keys: string[]): number | null {
  for (const k of keys) {
    const v = readPlanetLon(data, k);
    if (typeof v === "number") return v;
  }
  return null;
}

function extractBodies(data: AstroServiceData) {
  const northNode = readFirstPlanetLon(data, [
    "northNode",
    "north_node",
    "trueNode",
    "true_node",
    "meanNode",
    "mean_node",
    "node",
    "rahu",
  ]);

  const southNode =
    readFirstPlanetLon(data, ["southNode", "south_node", "ketu"]) ??
    (typeof northNode === "number" ? wrap360(northNode + 180) : null);

  return {
    sun: { lon: readPlanetLon(data, "sun") },
    moon: { lon: readPlanetLon(data, "moon") },
    mercury: { lon: readPlanetLon(data, "mercury") },
    venus: { lon: readPlanetLon(data, "venus") },
    mars: { lon: readPlanetLon(data, "mars") },
    jupiter: { lon: readPlanetLon(data, "jupiter") },
    saturn: { lon: readPlanetLon(data, "saturn") },
    uranus: { lon: readPlanetLon(data, "uranus") },
    neptune: { lon: readPlanetLon(data, "neptune") },
    pluto: { lon: readPlanetLon(data, "pluto") },
    chiron: { lon: readFirstPlanetLon(data, ["chiron"]) },
    northNode: { lon: northNode },
    southNode: { lon: southNode },
  };
}

// ------------------------------
// Derived: Asc-Year
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
  const withinSeason = p % 90;
  const idx = Math.floor(withinSeason / 30);
  const mods = ["Cardinal", "Fixed", "Mutable"] as const;
  return {
    modality: mods[idx] ?? "Cardinal",
    segment: idx + 1,
    total: 3,
    within: withinSeason % 30,
  };
}

function boundariesFromAsc(asc: number) {
  const b: Record<string, number> = {};
  for (let i = 0; i <= 12; i++) {
    const key = `deg${i * 30}`;
    b[key] = i === 12 ? wrap360(asc) : wrap360(asc + i * 30);
  }
  return b;
}

// ------------------------------
// Derived: Lunation
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

function makeSepCache(
  birthUTC: Date,
  fetchAt: (pDateUTC: Date) => Promise<{ sunLon: number; moonLon: number }>
) {
  const cache = new Map<number, { sep: number }>();
  return async (asOfUTCms: number) => {
    const key = Math.floor(asOfUTCms / 60_000) * 60_000;
    const hit = cache.get(key);
    if (hit) return hit;

    const asOfUTC = new Date(asOfUTCms);
    const pDateUTC = progressedDateUTC(birthUTC, asOfUTC);
    const { sunLon, moonLon } = await fetchAt(pDateUTC);
    const sep = sepWaxing(sunLon, moonLon);

    const v = { sep };
    cache.set(key, v);
    return v;
  };
}

/**
 * FAST coarse scan to find the wrap (sep crosses 360->0) in a bounded window.
 * Returns approximate date (midpoint of bracket) - no bisection refinement.
 */
async function findNewMoonWrapUTC(params: {
  startUTC: Date;
  direction: -1 | 1; // -1 previous, +1 next
  getAt: (ms: number) => Promise<{ sep: number }>;
}): Promise<Date> {
  const { startUTC, direction, getAt } = params;

  const oneDay = 86_400_000;
  const step = FULL_SCAN_STEP_DAYS * oneDay * direction;

  const maxDays = Math.max(1, Math.floor(FULL_SCAN_MAX_YEARS * 366));
  const maxSteps = Math.ceil(maxDays / Math.max(1, FULL_SCAN_STEP_DAYS));

  // Use wrap180 for sign-crossing detection (works with any step size)
  let tPrev = startUTC.getTime();
  let wPrev = wrap180((await getAt(tPrev)).sep);

  for (let i = 0; i < maxSteps; i++) {
    const tCur = tPrev + step;
    const wCur = wrap180((await getAt(tCur)).sep);

    // Wrap condition: wrap180(sep) crosses from negative to non-negative
    // (i.e., separation crossed 360°→0° boundary, indicating a new moon)
    const crossesZero =
      direction === 1
        ? wPrev < 0 && wCur >= 0
        : wCur < 0 && wPrev >= 0;

    if (crossesZero) {
      // Return midpoint of bracket (approximate date, no bisection)
      const lo = Math.min(tPrev, tCur);
      const hi = Math.max(tPrev, tCur);
      return new Date(Math.floor((lo + hi) / 2));
    }

    tPrev = tCur;
    wPrev = wCur;
  }

  throw new Error("could not locate progressed new moon wrap within bounded scan window");
}

/**
 * Find boundary sep >= targetDeg starting from anchorUTC with forward steps.
 * Returns approximate date (midpoint of bracket) - no bisection refinement.
 */
async function findBoundaryUTC_fast(
  anchorUTC: Date,
  targetDeg: number,
  getAt: (ms: number) => Promise<{ sep: number }>
): Promise<Date> {
  const oneDay = 86_400_000;

  if (targetDeg === 0) return new Date(anchorUTC.getTime());

  let lo = anchorUTC.getTime();
  let hi = lo;

  // Step forward until we cross target
  const step = Math.max(1, FULL_BOUNDARY_STEP_DAYS) * oneDay;
  let sHi = (await getAt(hi)).sep;

  const maxDaysForward = Math.max(30, Math.floor(FULL_SCAN_MAX_YEARS * 366));
  const maxSteps = Math.ceil(maxDaysForward / Math.max(1, FULL_BOUNDARY_STEP_DAYS));

  for (let i = 0; i < maxSteps && sHi < targetDeg; i++) {
    lo = hi;
    hi = hi + step;
    sHi = (await getAt(hi)).sep;
  }

  if (sHi < targetDeg) throw new Error(`could not bracket boundary for ${targetDeg}°`);

  // Return midpoint of bracket (approximate date, no bisection)
  return new Date(Math.floor((lo + hi) / 2));
}

function formatYMD(d: Date) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// ------------------------------
// Route handler
// ------------------------------

async function handlePost(req: NextRequest) {
  try {
    const input = await readInput(req);

    const lat = typeof input.lat === "number" ? input.lat : undefined;
    const lon = typeof input.lon === "number" ? input.lon : undefined;

    if (lat == null || lon == null) {
      throw new Error("Missing lat/lon (required for core because asc-year uses ascendant).");
    }

    const wantsFull = input.detail === "full" || input.includeBoundaries === true;
    const detail: "quick" | "full" = wantsFull ? "full" : "quick";

    const birthUTC = parseBirthToUTC(input.birth_datetime, input.tz_offset);
    const asOfUTC = parseAsOfToUTCDate(input.as_of_date);

    // --- natal chart ---
    const natalData = await fetchChartByYMDHM(
      birthUTC.getUTCFullYear(),
      birthUTC.getUTCMonth() + 1,
      birthUTC.getUTCDate(),
      birthUTC.getUTCHours(),
      birthUTC.getUTCMinutes(),
      lat,
      lon
    );

    if (typeof natalData.ascendant !== "number") throw new Error("astro-service missing ascendant (check lat/lon)");
    if (typeof natalData.mc !== "number") throw new Error("astro-service missing mc (check lat/lon)");

    const natal = {
      jd_ut: natalData.julianDay,
      ascendant: wrap360(natalData.ascendant),
      mc: wrap360(natalData.mc),
      houses: natalData.houses ?? [],
      bodies: extractBodies(natalData),
    };

    if (typeof natal.bodies.sun.lon !== "number") throw new Error("astro-service missing natal sun lon");
    if (typeof natal.bodies.moon.lon !== "number") throw new Error("astro-service missing natal moon lon");

    // --- as-of chart ---
    const asOfData = await fetchChartByYMDHM(
      asOfUTC.getUTCFullYear(),
      asOfUTC.getUTCMonth() + 1,
      asOfUTC.getUTCDate(),
      asOfUTC.getUTCHours(),
      asOfUTC.getUTCMinutes(),
      lat,
      lon
    );

    const asOf = {
      jd_ut: asOfData.julianDay,
      ascendant: typeof asOfData.ascendant === "number" ? wrap360(asOfData.ascendant) : null,
      mc: typeof asOfData.mc === "number" ? wrap360(asOfData.mc) : null,
      houses: asOfData.houses ?? [],
      bodies: extractBodies(asOfData),
    };

    if (typeof asOf.bodies.sun.lon !== "number") throw new Error("astro-service missing asOf sun lon");

    // --- derived: asc-year ---
    const cyclePosition = sepWaxing(natal.ascendant, asOf.bodies.sun.lon);
    const season = seasonFromCyclePos(cyclePosition);
    const mod = modalityFromCyclePos(cyclePosition);
    const boundariesLongitude = boundariesFromAsc(natal.ascendant);

    const ascYear = {
      anchorAsc: natal.ascendant,
      cyclePosition,
      season,
      modality: mod.modality,
      modalitySegment: `${mod.modality} (segment ${mod.segment}/${mod.total})`,
      degreesIntoModality: mod.within,
      boundariesLongitude,
    };

    // --- derived: lunation ---
    const fetchProgressedSunMoon = async (pDateUTC: Date) => {
      const d = await fetchChartByYMDHM(
        pDateUTC.getUTCFullYear(),
        pDateUTC.getUTCMonth() + 1,
        pDateUTC.getUTCDate(),
        pDateUTC.getUTCHours(),
        pDateUTC.getUTCMinutes(),
        0,
        0
      );

      const sunLon = readPlanetLon(d, "sun");
      const moonLon = readPlanetLon(d, "moon");
      if (typeof sunLon !== "number" || typeof moonLon !== "number") {
        throw new Error("astro-service response missing sun/moon lon (progressed)");
      }
      return { sunLon, moonLon };
    };

    const pDateUTC = progressedDateUTC(birthUTC, asOfUTC);
    const { sunLon: pSunLon, moonLon: pMoonLon } = await fetchProgressedSunMoon(pDateUTC);

    const separation = sepWaxing(pSunLon, pMoonLon);
    const phase = phaseLabelFromSep(separation);
    const sub = subPhaseLabelFromSep(separation);

    const lunation: any = {
      mode: detail,
      progressedDateUTC: pDateUTC.toISOString(),
      progressedSunLon: pSunLon,
      progressedMoonLon: pMoonLon,
      separation,
      phase,
      subPhase: {
        label: sub.label,
        segment: sub.segment,
        total: sub.total,
        within: sub.within,
      },
    };

    if (detail === "full") {
      const getAt = makeSepCache(birthUTC, fetchProgressedSunMoon);
      const lunationStart = Date.now();

      // FAST bounded coarse scans
      const prevNewMoonUTC = await findNewMoonWrapUTC({ startUTC: asOfUTC, direction: -1, getAt });
      const nextNewMoonUTC = await findNewMoonWrapUTC({ startUTC: asOfUTC, direction: +1, getAt });

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

      const boundaries: { deg: number; label: string; dateUTC: string | null }[] = [];
      let boundaryTimedOut = false;

      for (let i = 0; i < boundaryTargets.length; i++) {
        // Check time budget before each boundary calculation
        if (Date.now() - lunationStart > LUNATION_TIME_BUDGET_MS) {
          boundaryTimedOut = true;
          // Fill remaining boundaries with null
          for (let j = i; j < boundaryTargets.length; j++) {
            boundaries.push({
              deg: boundaryTargets[j],
              label: boundaryLabels[j],
              dateUTC: null,
            });
          }
          break;
        }

        const deg = boundaryTargets[i];
        const label = boundaryLabels[i];
        try {
          const d = await findBoundaryUTC_fast(prevNewMoonUTC, deg, getAt);
          boundaries.push({ deg, label, dateUTC: formatYMD(d) });
        } catch {
          // If boundary calculation fails, mark as null and continue
          boundaries.push({ deg, label, dateUTC: null });
        }
      }

      lunation.prevNewMoonUTC = formatYMD(prevNewMoonUTC);
      lunation.nextNewMoonUTC = formatYMD(nextNewMoonUTC);
      lunation.boundaries = boundaries;
      lunation.boundaryTimedOut = boundaryTimedOut;
    }

    const summary = buildDerivedSummary({ natal, asOf, ascYear, lunation });

    const textLines: string[] = [];
    textLines.push("URA • Core");
    textLines.push("");
    textLines.push(`Birth (local): ${input.birth_datetime}  tz_offset ${input.tz_offset}`);
    textLines.push(`As-of (UTC):   ${input.as_of_date} 00:00`);
    textLines.push("");
    textLines.push(`Natal ASC: ${natal.ascendant.toFixed(2)}° (${angleToSign(natal.ascendant)})`);
    textLines.push(`AsOf Sun:   ${asOf.bodies.sun.lon.toFixed(2)}° (${angleToSign(asOf.bodies.sun.lon)})`);
    textLines.push("");
    textLines.push(`Asc-Year: ${ascYear.season} · ${ascYear.modality} · ${ascYear.cyclePosition.toFixed(2)}°`);
    textLines.push(
      `Lunation(${detail}): ${lunation.phase} · ${lunation.subPhase.label} · sep ${lunation.separation.toFixed(2)}°`
    );

    return NextResponse.json({
      ok: true,
      input,
      birthUTC: birthUTC.toISOString(),
      asOfUTC: asOfUTC.toISOString(),
      natal,
      asOf,
      derived: { ascYear, lunation, summary },
      text: textLines.join("\n"),
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || "unknown error" }, { status: 400 });
  }
}

export const POST = withComputeRateLimit(handlePost);
