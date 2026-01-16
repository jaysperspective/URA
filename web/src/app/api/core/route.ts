// web/src/app/api/core/route.ts

import { NextRequest, NextResponse } from "next/server";
import { withComputeRateLimit } from "@/lib/withRateLimit";

/**
 * URA /api/core
 * One endpoint that returns:
 * - natal chart (angles + houses + bodies)
 * - asOf chart (angles + houses + bodies)
 * - derived: ascYear + lunation (reusing existing, proven models)
 *
 * Notes:
 * - Asc-Year still requires lat/lon (for ASC).
 * - Lunation uses progressed Sun/Moon and does not require location; we keep your existing approach.
 *
 * ✅ FIX (real): the progressed-lunation search must not scan day-by-day across decades.
 * We now do coarse bracketing (30-day steps) + binary refinement.
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
    planets: Record<string, { lon: number; lat?: number; speed?: number } | undefined>;
    houses?: number[];
    ascendant?: number | null;
    mc?: number | null;
  };
};

type AstroServiceData = NonNullable<AstroServiceChart["data"]>;

const ASTRO_URL = process.env.ASTRO_SERVICE_URL || "http://127.0.0.1:3002";

// ------------------------------
// Parsing (copied from asc-year/lunation; keep identical behavior)
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

  return out as ParsedInput;
}

/**
 * Compute a ±HH:MM offset string for an IANA timezone at a given local datetime.
 * Uses Intl timeZoneName "shortOffset" available in Node 20.
 */
function tzOffsetForZoneAtLocal(
  timeZone: string,
  year: number,
  month: number, // 1-12
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
  // 1) Already ParsedInput
  if (
    obj &&
    typeof obj === "object" &&
    typeof obj.birth_datetime === "string" &&
    typeof obj.tz_offset === "string" &&
    typeof obj.as_of_date === "string"
  ) {
    const lat = toNum(obj.lat ?? obj.latitude);
    const lon = toNum(obj.lon ?? obj.longitude);
    return {
      birth_datetime: obj.birth_datetime,
      tz_offset: obj.tz_offset,
      as_of_date: obj.as_of_date,
      lat: lat ?? undefined,
      lon: lon ?? undefined,
    };
  }

  // 2) URA structured contract
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
      if (obj && typeof obj === "object" && typeof obj.text === "string") {
        return parseTextKV(obj.text);
      }
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

// Secondary progression: day-for-year
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
// Derived summary helpers (for UI)
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
    // NOTE: if you ever need a hard timeout, swap to AbortSignal.timeout(...)
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

function formatYMD(d: Date) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * ✅ PERF: cache sep computations into larger time buckets.
 * The previous minute-bucket cache caused essentially no reuse during multi-year scanning.
 */
function makeSepCache(
  birthUTC: Date,
  fetchAt: (pDateUTC: Date) => Promise<{ sunLon: number; moonLon: number }>
) {
  // 12-hour bucket (tunable)
  const BUCKET_MS = 12 * 60 * 60 * 1000;

  const cache = new Map<number, { sep: number }>();
  return async (asOfUTCms: number) => {
    const key = Math.floor(asOfUTCms / BUCKET_MS) * BUCKET_MS;
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
 * ✅ NEW: Find a New Moon crossing using coarse bracketing + binary refine.
 * We search on f(t)=wrap180(sep(t)) and look for a sign change.
 */
async function findNewMoonCrossingUTC(params: {
  startUTC: Date;
  direction: -1 | 1; // -1 = previous, +1 = next
  getAt: (ms: number) => Promise<{ sep: number }>;
}) {
  const { startUTC, direction, getAt } = params;

  const oneDay = 86_400_000;
  const stepDays = 30; // ✅ key perf lever (30 days is a good default)
  const stepMs = stepDays * oneDay;

  const maxYears = 90; // safety
  const maxSteps = Math.ceil((maxYears * 366) / stepDays);

  const f = async (ms: number) => wrap180((await getAt(ms)).sep);

  let t1 = startUTC.getTime();
  let f1 = await f(t1);

  for (let i = 0; i < maxSteps; i++) {
    const t0 = t1 + direction * -stepMs; // move backwards if direction=-1, forward if direction=+1
    const f0 = await f(t0);

    // Bracket a sign change (or very near zero)
    if (f0 === 0) return new Date(t0);
    if (f1 === 0) return new Date(t1);

    const crossed = (f0 < 0 && f1 > 0) || (f0 > 0 && f1 < 0);
    if (crossed) {
      // Binary refine between t0 and t1
      let lo = Math.min(t0, t1);
      let hi = Math.max(t0, t1);
      let flo = await f(lo);
      let fhi = await f(hi);

      for (let it = 0; it < 40; it++) {
        const mid = Math.floor((lo + hi) / 2);
        const fmid = await f(mid);

        if (Math.abs(fmid) < 1e-6) return new Date(mid);

        // keep the half interval that contains the sign change
        const leftCross = (flo < 0 && fmid > 0) || (flo > 0 && fmid < 0);
        if (leftCross) {
          hi = mid;
          fhi = fmid;
        } else {
          lo = mid;
          flo = fmid;
        }

        if (hi - lo < 30 * 60_000) break; // within 30 minutes
      }

      return new Date(Math.floor((lo + hi) / 2));
    }

    t1 = t0;
    f1 = f0;
  }

  throw new Error("could not locate progressed new moon (coarse scan exceeded limit)");
}

/**
 * ✅ NEW: bracket all phase boundaries (0,45,...315) in one forward scan.
 * Then refine each boundary by binary search inside its bracket.
 */
async function computeBoundariesFromPrevNewMoon(params: {
  prevNewMoonUTC: Date;
  getAt: (ms: number) => Promise<{ sep: number }>;
}) {
  const { prevNewMoonUTC, getAt } = params;

  const oneDay = 86_400_000;
  const stepDays = 30; // same perf lever
  const stepMs = stepDays * oneDay;

  const targets = [0, 45, 90, 135, 180, 225, 270, 315] as const;
  const labels = [
    "New Moon (0°)",
    "Crescent (45°)",
    "First Quarter (90°)",
    "Gibbous (135°)",
    "Full Moon (180°)",
    "Disseminating (225°)",
    "Last Quarter (270°)",
    "Balsamic (315°)",
  ] as const;

  // We assume sep is ~0 at prevNewMoon and generally increases through the progressed cycle.
  // We bracket each target in a single scan.
  const brackets: { deg: number; label: string; lo: number; hi: number }[] = [];

  let t0 = prevNewMoonUTC.getTime();
  let s0 = (await getAt(t0)).sep;

  // ensure target 0 is anchored
  brackets.push({ deg: 0, label: labels[0], lo: t0, hi: t0 });

  let nextIdx = 1;

  const maxYearsForward = 90;
  const maxSteps = Math.ceil((maxYearsForward * 366) / stepDays);

  for (let i = 0; i < maxSteps && nextIdx < targets.length; i++) {
    const t1 = t0 + stepMs;
    const s1 = (await getAt(t1)).sep;

    // If wrap happened (rarely), normalize by treating s1 as >= s0 by adding 360
    let a0 = s0;
    let a1 = s1;
    if (a1 + 1e-6 < a0) a1 += 360;

    while (nextIdx < targets.length) {
      const tgt = targets[nextIdx];
      const tgtVal = tgt; // 0..315

      if (a0 <= tgtVal && tgtVal <= a1) {
        brackets.push({ deg: tgtVal, label: labels[nextIdx], lo: t0, hi: t1 });
        nextIdx++;
      } else {
        break;
      }
    }

    t0 = t1;
    s0 = s1;

    // Stop early once we've bracketed all
    if (nextIdx >= targets.length) break;
  }

  if (brackets.length !== targets.length) {
    throw new Error("could not bracket all lunation boundaries (forward scan exceeded limit)");
  }

  // Refine each boundary time
  const refined = [];
  for (const b of brackets) {
    if (b.lo === b.hi) {
      refined.push({ deg: b.deg, label: b.label, dateUTC: formatYMD(new Date(b.lo)) });
      continue;
    }

    let lo = b.lo;
    let hi = b.hi;
    const targetDeg = b.deg;

    for (let it = 0; it < 45; it++) {
      const mid = Math.floor((lo + hi) / 2);
      let smid = (await getAt(mid)).sep;

      // handle wrap relative to lo endpoint
      let slo = (await getAt(lo)).sep;
      if (smid + 1e-6 < slo) smid += 360;
      if (slo + 1e-6 < targetDeg && smid >= targetDeg) {
        hi = mid;
      } else {
        lo = mid;
      }

      if (hi - lo < 30 * 60_000) break;
    }

    refined.push({ deg: b.deg, label: b.label, dateUTC: formatYMD(new Date(hi)) });
  }

  return refined;
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

    // --- as-of chart (00:00 UTC) ---
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

    // ------------------------------
    // derived: asc-year
    // ------------------------------
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

    // ------------------------------
    // derived: lunation (progressed)  ✅ PERF FIXED
    // ------------------------------
    const fetchProgressedSunMoon = async (pDateUTC: Date) => {
      // keep your existing behavior (lat/lon 0,0 for progressed bodies)
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
    const getAt = makeSepCache(birthUTC, fetchProgressedSunMoon);

    const { sunLon: pSunLon, moonLon: pMoonLon } = await fetchProgressedSunMoon(pDateUTC);
    const separation = sepWaxing(pSunLon, pMoonLon);
    const phase = phaseLabelFromSep(separation);
    const sub = subPhaseLabelFromSep(separation);

    // ✅ Find previous/next New Moon with coarse bracketing
    const prevNewMoonUTC = await findNewMoonCrossingUTC({
      startUTC: asOfUTC,
      direction: -1,
      getAt,
    });

    const nextNewMoonUTC = await findNewMoonCrossingUTC({
      startUTC: asOfUTC,
      direction: +1,
      getAt,
    });

    // ✅ Compute all boundaries from prev new moon in one scan
    const boundaries = await computeBoundariesFromPrevNewMoon({
      prevNewMoonUTC,
      getAt,
    });

    const lunation = {
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
      boundaries,
      nextNewMoonUTC: formatYMD(nextNewMoonUTC),
    };

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
    textLines.push(`Lunation: ${lunation.phase} · ${lunation.subPhase.label} · sep ${lunation.separation.toFixed(2)}°`);

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
