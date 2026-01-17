// src/lib/sun/collectiveData.ts
// Shared logic for collective sun/lunar data - NO personal data
import { microcopyForPhase, type PhaseId } from "@/lib/phaseMicrocopy";

// Simple TTL cache
type CacheEntry<T> = { exp: number; value: T };
function makeTTLCache<T>() {
  const map = new Map<string, CacheEntry<T>>();
  return {
    get(key: string): T | null {
      const hit = map.get(key);
      if (!hit) return null;
      if (Date.now() > hit.exp) {
        map.delete(key);
        return null;
      }
      return hit.value;
    },
    set(key: string, value: T, ttlMs: number) {
      map.set(key, { value, exp: Date.now() + ttlMs });
    },
  };
}

const TTL_10_MIN = 10 * 60 * 1000;
const TTL_30_DAYS = 30 * 24 * 60 * 60 * 1000;

const chartCache = makeTTLCache<{ sunLon: number; moonLon: number; phaseAngleDeg: number }>();
const ariesIngressCache = makeTTLCache<string>();

function normalize360(deg: number) {
  const v = deg % 360;
  return v < 0 ? v + 360 : v;
}

function signedDiffDeg(a: number, target: number) {
  return ((a - target + 540) % 360) - 180;
}

const SIGNS = [
  { name: "Aries", short: "Ari", glyph: "\u2648" },
  { name: "Taurus", short: "Tau", glyph: "\u2649" },
  { name: "Gemini", short: "Gem", glyph: "\u264A" },
  { name: "Cancer", short: "Can", glyph: "\u264B" },
  { name: "Leo", short: "Leo", glyph: "\u264C" },
  { name: "Virgo", short: "Vir", glyph: "\u264D" },
  { name: "Libra", short: "Lib", glyph: "\u264E" },
  { name: "Scorpio", short: "Sco", glyph: "\u264F" },
  { name: "Sagittarius", short: "Sag", glyph: "\u2650" },
  { name: "Capricorn", short: "Cap", glyph: "\u2651" },
  { name: "Aquarius", short: "Aqu", glyph: "\u2652" },
  { name: "Pisces", short: "Pis", glyph: "\u2653" },
] as const;

function signFromLon(lon: number) {
  const idx = Math.floor(normalize360(lon) / 30) % 12;
  return SIGNS[idx];
}

function degInSign(lon: number): number {
  const x = normalize360(lon);
  return x % 30;
}

function phaseNameFromAngle(a: number) {
  const x = normalize360(a);
  if (x < 22.5 || x >= 337.5) return "New Moon";
  if (x < 67.5) return "Waxing Crescent";
  if (x < 112.5) return "First Quarter";
  if (x < 157.5) return "Waxing Gibbous";
  if (x < 202.5) return "Full Moon";
  if (x < 247.5) return "Waning Gibbous";
  if (x < 292.5) return "Last Quarter";
  return "Waning Crescent";
}

function lunarURAPhaseId(phaseAngleDeg: number): PhaseId {
  const a = normalize360(phaseAngleDeg);
  const idx = Math.floor((a + 22.5) / 45) % 8;
  return (idx + 1) as PhaseId;
}

function solarSeasonLabel(sunLon: number): string {
  const lon = normalize360(sunLon);
  if (lon < 90) return "Spring";
  if (lon < 180) return "Summer";
  if (lon < 270) return "Fall";
  return "Winter";
}

function solarPhaseLabel(phase: number): string {
  const labels: Record<number, string> = {
    1: "Emergence",
    2: "Establishment",
    3: "Assertion",
    4: "Illumination",
    5: "Integration",
    6: "Reorientation",
    7: "Withdrawal",
    8: "Dissolution",
  };
  return labels[phase] || "Unknown";
}

function lunarDirective(phaseId: PhaseId): string {
  const mc = microcopyForPhase(phaseId);
  return mc.oneLine;
}

function getAstroServiceChartUrl() {
  const raw = process.env.ASTRO_SERVICE_URL || "http://127.0.0.1:3002";
  const base = raw.replace(/\/+$/, "").replace(/\/chart$/, "");
  return `${base}/chart`;
}

function chartKey(d: Date, lat: number, lon: number) {
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth() + 1;
  const day = d.getUTCDate();
  const hh = d.getUTCHours();
  const mm = d.getUTCMinutes();
  const la = Math.round(lat * 10000) / 10000;
  const lo = Math.round(lon * 10000) / 10000;
  return `sun:${y}-${m}-${day}T${hh}:${mm}|${la}|${lo}`;
}

async function chartAtUTC(d: Date, latitude: number, longitude: number) {
  const key = chartKey(d, latitude, longitude);
  const cached = chartCache.get(key);
  if (cached) return cached;

  const chartUrl = getAstroServiceChartUrl();
  const payload = {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
    hour: d.getUTCHours(),
    minute: d.getUTCMinutes(),
    latitude,
    longitude,
  };

  const r = await fetch(chartUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!r.ok) {
    const t = await r.text();
    throw new Error(`astro-service error (${r.status}) ${t.slice(0, 200)}`);
  }

  const json = await r.json();
  const sunLon = json?.data?.planets?.sun?.lon;
  const moonLon = json?.data?.planets?.moon?.lon;

  if (typeof sunLon !== "number" || typeof moonLon !== "number") {
    throw new Error("astro-service response missing sun/moon lon");
  }

  const phaseAngleDeg = normalize360(moonLon - sunLon);
  const out = { sunLon, moonLon, phaseAngleDeg };

  chartCache.set(key, out, TTL_10_MIN);
  return out;
}

async function findAriesIngressUTC(params: {
  year: number;
  latitude: number;
  longitude: number;
}): Promise<Date> {
  const { year, latitude, longitude } = params;

  const la = Math.round(latitude * 10) / 10;
  const lo = Math.round(longitude * 10) / 10;
  const cacheKey = `ariesIngress:${year}|${la}|${lo}`;

  const cachedISO = ariesIngressCache.get(cacheKey);
  if (cachedISO) return new Date(cachedISO);

  const start = new Date(Date.UTC(year, 2, 18, 0, 0, 0));
  const end = new Date(Date.UTC(year, 2, 23, 0, 0, 0));

  const startChart = await chartAtUTC(start, latitude, longitude);

  let prevT = start;
  let prevDiff = signedDiffDeg(startChart.sunLon, 0);

  const totalHours = Math.floor((end.getTime() - start.getTime()) / 3600_000);
  for (let i = 1; i <= totalHours; i++) {
    const t = new Date(start.getTime() + i * 3600_000);
    const cur = await chartAtUTC(t, latitude, longitude);
    const curDiff = signedDiffDeg(cur.sunLon, 0);

    if (
      prevDiff === 0 ||
      curDiff === 0 ||
      (prevDiff < 0 && curDiff > 0) ||
      (prevDiff > 0 && curDiff < 0)
    ) {
      let loMs = prevT.getTime();
      let hiMs = t.getTime();

      for (let k = 0; k < 20; k++) {
        const mid = Math.floor((loMs + hiMs) / 2);
        const midChart = await chartAtUTC(new Date(mid), latitude, longitude);
        const midDiff = signedDiffDeg(midChart.sunLon, 0);

        if ((prevDiff <= 0 && midDiff <= 0) || (prevDiff >= 0 && midDiff >= 0)) {
          loMs = mid;
          prevDiff = midDiff;
        } else {
          hiMs = mid;
        }
      }

      const out = new Date(hiMs);
      ariesIngressCache.set(cacheKey, out.toISOString(), TTL_30_DAYS);
      return out;
    }

    prevT = t;
    prevDiff = curDiff;
  }

  const fallback = new Date(Date.UTC(year, 2, 20, 12, 0, 0));
  ariesIngressCache.set(cacheKey, fallback.toISOString(), TTL_30_DAYS);
  return fallback;
}

function fmtLocalFromUTC(isoUTC: string, tzOffsetMinEast: number) {
  const ms = Date.parse(isoUTC);
  if (!Number.isFinite(ms)) return isoUTC;
  const localMs = ms + tzOffsetMinEast * 60_000;
  const d = new Date(localMs);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${y}-${m}-${day} ${hh}:${mm}`;
}

// URA Foundation principles (collective)
const URA_FOUNDATION_PRINCIPLES = [
  "Time is cyclical, anchored to 0 Aries.",
  "The Sun marks collective rhythm; the Moon marks collective cadence.",
  "Orientation precedes action.",
  "Clarity over prediction.",
];

export type CollectiveData = {
  ok: boolean;
  error?: string;
  tz: string;
  gregorian: {
    ymd: string;
    asOfLocal: string;
    asOfUTC: string;
  };
  solar: {
    sunSign: string;
    sunSignShort: string;
    sunSignGlyph: string;
    sunDegreeInSign: number;
    sunMinuteInSign: number;
    sunLongitude: number;
    solarSeasonLabel: string;
    solarPhaseLabel: string;
    solarPhase: number;
    dayInPhase: number;
    dayIndexInYear: number;
    yearLength: number;
  };
  lunar: {
    phaseName: string;
    lunarPhaseId: number;
    dayInPhase: number;
    lunarDay: number;
    lunarAgeDays: number;
    phaseAngleDeg: number;
    lunarDirective: string;
    moonSign: string;
  };
  ura: {
    foundationPrinciples: string[];
    microcopy: {
      solar: string;
      lunar: string;
    };
  };
};

export async function getCollectiveData(params: {
  tzOffsetMin?: number;
  latitude?: number;
  longitude?: number;
}): Promise<CollectiveData> {
  const { tzOffsetMin = 0, latitude = 0, longitude = 0 } = params;

  try {
    const asOfUTC = new Date();
    const { sunLon, moonLon, phaseAngleDeg } = await chartAtUTC(asOfUTC, latitude, longitude);

    // Solar data (collective, 0 Aries origin)
    const sunSign = signFromLon(sunLon);
    const sunDegreeInSign = Math.floor(degInSign(sunLon));
    const sunMinuteInSign = Math.floor((degInSign(sunLon) - sunDegreeInSign) * 60);

    // Solar year calculation (0 Aries start)
    const guessYear = asOfUTC.getUTCFullYear();
    const thisYearIngress = await findAriesIngressUTC({ year: guessYear, latitude, longitude });

    let solarYearStart = thisYearIngress;
    if (asOfUTC.getTime() < thisYearIngress.getTime()) {
      solarYearStart = await findAriesIngressUTC({ year: guessYear - 1, latitude, longitude });
    }
    const nextSolarYearStart = await findAriesIngressUTC({
      year: solarYearStart.getUTCFullYear() + 1,
      latitude,
      longitude,
    });

    const dayIndexInSolarYear = Math.max(
      0,
      Math.floor((asOfUTC.getTime() - solarYearStart.getTime()) / 86400000)
    );
    const yearLength = Math.max(
      1,
      Math.round((nextSolarYearStart.getTime() - solarYearStart.getTime()) / 86400000)
    );

    const solarPhase = (Math.floor(dayIndexInSolarYear / 45) % 8) + 1;
    const dayInPhase = (dayIndexInSolarYear % 45) + 1;

    // Lunar data (collective)
    const phaseName = phaseNameFromAngle(phaseAngleDeg);
    const lunarPhaseId = lunarURAPhaseId(phaseAngleDeg);
    const synodicMonthDays = 29.530588;
    const lunarAgeDays = (normalize360(phaseAngleDeg) / 360) * synodicMonthDays;
    const lunarDay = Math.max(1, Math.min(30, Math.floor(lunarAgeDays) + 1));
    const dayInLunarPhase = ((lunarDay - 1) % 4) + 1;

    const isoAsOf = asOfUTC.toISOString();
    const asOfLocal = fmtLocalFromUTC(isoAsOf, tzOffsetMin);

    return {
      ok: true,
      tz: "UTC",
      gregorian: {
        ymd: asOfUTC.toISOString().slice(0, 10),
        asOfLocal,
        asOfUTC: isoAsOf,
      },
      solar: {
        sunSign: sunSign.name,
        sunSignShort: sunSign.short,
        sunSignGlyph: sunSign.glyph,
        sunDegreeInSign,
        sunMinuteInSign,
        sunLongitude: Math.round(normalize360(sunLon) * 1000) / 1000,
        solarSeasonLabel: solarSeasonLabel(sunLon),
        solarPhaseLabel: solarPhaseLabel(solarPhase),
        solarPhase,
        dayInPhase,
        dayIndexInYear: dayIndexInSolarYear,
        yearLength,
      },
      lunar: {
        phaseName,
        lunarPhaseId,
        dayInPhase: dayInLunarPhase,
        lunarDay,
        lunarAgeDays: Math.round(lunarAgeDays * 100) / 100,
        phaseAngleDeg: Math.round(phaseAngleDeg * 10) / 10,
        lunarDirective: lunarDirective(lunarPhaseId),
        moonSign: signFromLon(moonLon).name,
      },
      ura: {
        foundationPrinciples: URA_FOUNDATION_PRINCIPLES,
        microcopy: {
          solar: microcopyForPhase(solarPhase as PhaseId).oneLine,
          lunar: microcopyForPhase(lunarPhaseId).oneLine,
        },
      },
    };
  } catch (err: any) {
    return {
      ok: false,
      error: err?.message ?? "Unknown error",
      tz: "UTC",
      gregorian: { ymd: "", asOfLocal: "", asOfUTC: "" },
      solar: {
        sunSign: "",
        sunSignShort: "",
        sunSignGlyph: "",
        sunDegreeInSign: 0,
        sunMinuteInSign: 0,
        sunLongitude: 0,
        solarSeasonLabel: "",
        solarPhaseLabel: "",
        solarPhase: 1,
        dayInPhase: 1,
        dayIndexInYear: 0,
        yearLength: 365,
      },
      lunar: {
        phaseName: "",
        lunarPhaseId: 1,
        dayInPhase: 1,
        lunarDay: 1,
        lunarAgeDays: 0,
        phaseAngleDeg: 0,
        lunarDirective: "",
        moonSign: "",
      },
      ura: {
        foundationPrinciples: URA_FOUNDATION_PRINCIPLES,
        microcopy: { solar: "", lunar: "" },
      },
    };
  }
}
