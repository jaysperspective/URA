// web/src/app/api/core/route.ts

import { NextResponse } from "next/server";

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
// Time helpers (same as your routes)
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

// Secondary progression: day-for-year (from lunation route)
function progressedDateUTC(birthUTC: Date, asOfUTC: Date): Date {
  const msPerDay = 86_400_000;
  const elapsedDays = (asOfUTC.getTime() - birthUTC.getTime()) / msPerDay;
  const ageYears = elapsedDays / 365.2425;
  return new Date(birthUTC.getTime() + ageYears * msPerDay);
}

// ------------------------------
// Math helpers (same)
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
// NEW: Derived summary helpers (for UI)
// ------------------------------

function signLabel(deg: number | null | undefined) {
  if (typeof deg !== "number" || !Number.isFinite(deg)) return null;
  return angleToSign(deg);
}

function fmtDeg(deg: number | null | undefined, digits = 2) {
  if (typeof deg !== "number" || !Number.isFinite(deg)) return null;
  return Number(wrap360(deg).toFixed(digits));
}

function buildDerivedSummary(params: {
  natal: any;
  asOf: any;
  ascYear: any;
  lunation: any;
}) {
  const { natal, asOf, ascYear, lunation } = params;

  const natalAsc = fmtDeg(natal?.ascendant);
  const natalMc = fmtDeg(natal?.mc);
  const asOfSun = fmtDeg(asOf?.bodies?.sun?.lon);

  const aySeason = typeof ascYear?.season === "string" ? ascYear.season : null;
  const ayModality = typeof ascYear?.modality === "string" ? ascYear.modality : null;

  const ascYearLabel =
    aySeason && ayModality ? `${aySeason} · ${ayModality}` : aySeason || ayModality || null;

  const lunPhase = typeof lunation?.phase === "string" ? lunation.phase : null;
  const lunSub = typeof lunation?.subPhase?.label === "string" ? lunation.subPhase.label : null;

  const lunationLabel =
    lunPhase && lunSub ? `${lunPhase} · ${lunSub}` : lunPhase || lunSub || null;

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

// Build “bodies” with a stable key set (null allowed)
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
// Derived: Asc-Year (copied from asc-year route, same logic)
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
// Derived: Lunation (reuses your lunation model, but returns structured output)
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

        if (flo <= 0 && fmid >= 0) (hi = mid), (fhi = fmid);
        else if (fmid <= 0 && fhi >= 0) (lo = mid), (flo = fmid);
        else {
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

        if (flo <= 0 && fmid >= 0) (hi = mid), (fhi = fmid);
        else if (fmid <= 0 && fhi >= 0) (lo = mid), (flo = fmid);
        else {
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
    throw new Error(`could not bracket boundary for ${targetDeg}° (forward scan exceeded limit)`);
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

function formatYMD(d: Date) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// ------------------------------
// Route handler
// ------------------------------

export async function POST(req: Request) {
  try {
    const input = await readInput(req);

    const lat = typeof input.lat === "number" ? input.lat : undefined;
    const lon = typeof input.lon === "number" ? input.lon : undefined;

    // Core endpoint can still run lunation without location, but asc-year needs it.
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

    if (typeof natalData.ascendant !== "number") {
      throw new Error("astro-service missing ascendant (check lat/lon)");
    }
    if (typeof natalData.mc !== "number") {
      throw new Error("astro-service missing mc (check lat/lon)");
    }

    const natal = {
      jd_ut: natalData.julianDay,
      ascendant: wrap360(natalData.ascendant),
      mc: wrap360(natalData.mc),
      houses: natalData.houses ?? [],
      bodies: extractBodies(natalData),
    };

    // Require sun/moon at minimum (same as your expectation in asc-year)
    if (typeof natal.bodies.sun.lon !== "number") throw new Error("astro-service missing natal sun lon");
    if (typeof natal.bodies.moon.lon !== "number") throw new Error("astro-service missing natal moon lon");

    // --- as-of chart (transits at 00:00 UTC date) ---
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

    if (typeof asOf.bodies.sun.lon !== "number") {
      throw new Error("astro-service missing asOf sun lon");
    }

    // ------------------------------
    // derived: asc-year (same as your asc-year route)
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
    // derived: lunation (progressed, same model as your lunation route)
    // ------------------------------
    const fetchProgressedSunMoon = async (pDateUTC: Date) => {
      // lunation route uses lat/lon 0,0; we can keep that exact behavior
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

    const prevNewMoonUTC = await findPreviousNewMoonUTC(asOfUTC, getAt);
    const nextNewMoonUTC = await findNextNewMoonUTC(asOfUTC, getAt);

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

    const boundaries = [];
    for (let i = 0; i < boundaryTargets.length; i++) {
      const deg = boundaryTargets[i];
      const label = boundaryLabels[i];
      const d = await findBoundaryUTC(prevNewMoonUTC, deg, getAt);
      boundaries.push({ deg, label, dateUTC: formatYMD(d) });
    }

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

    // ------------------------------
    // NEW: derived.summary (UI-ready “chips” + key numbers)
    // ------------------------------
    const summary = buildDerivedSummary({ natal, asOf, ascYear, lunation });

    // Optional: keep a compact text “readout” so your existing UI doesn’t lose that vibe.
    const textLines: string[] = [];
    textLines.push("URA • Core");
    textLines.push("");
    textLines.push(`Birth (local): ${input.birth_datetime}  tz_offset ${input.tz_offset}`);
    textLines.push(`As-of (UTC):   ${input.as_of_date} 00:00`);
    textLines.push("");
    textLines.push(`Natal ASC: ${natal.ascendant.toFixed(2)}° (${angleToSign(natal.ascendant)})`);
    textLines.push(`AsOf Sun:   ${asOf.bodies.sun.lon.toFixed(2)}° (${angleToSign(asOf.bodies.sun.lon)})`);
    textLines.push("");
    textLines.push(
      `Asc-Year: ${ascYear.season} · ${ascYear.modality} · ${ascYear.cyclePosition.toFixed(2)}°`
    );
    textLines.push(
      `Lunation: ${lunation.phase} · ${lunation.subPhase.label} · sep ${lunation.separation.toFixed(2)}°`
    );

    const payload = {
      ok: true,
      input,
      birthUTC: birthUTC.toISOString(),
      asOfUTC: asOfUTC.toISOString(),
      natal,
      asOf,
      derived: { ascYear, lunation, summary },
      text: textLines.join("\n"),
    };

    return NextResponse.json(payload);
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "unknown error" },
      { status: 400 }
    );
  }
}
