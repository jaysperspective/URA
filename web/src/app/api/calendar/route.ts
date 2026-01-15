// src/app/api/calendar/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Marker = {
  kind: "New Moon" | "First Quarter" | "Full Moon" | "Last Quarter";
  whenLocal: string;
  degreeText: string;
  isoUTC: string;
};

function normalize360(deg: number) {
  const v = deg % 360;
  return v < 0 ? v + 360 : v;
}

// returns [-180,180)
function signedDiffDeg(a: number, target: number) {
  return ((a - target + 540) % 360) - 180;
}

const SIGNS = [
  { name: "Aries", short: "Ari" },
  { name: "Taurus", short: "Tau" },
  { name: "Gemini", short: "Gem" },
  { name: "Cancer", short: "Can" },
  { name: "Leo", short: "Leo" },
  { name: "Virgo", short: "Vir" },
  { name: "Libra", short: "Lib" },
  { name: "Scorpio", short: "Sco" },
  { name: "Sagittarius", short: "Sag" },
  { name: "Capricorn", short: "Cap" },
  { name: "Aquarius", short: "Aqu" },
  { name: "Pisces", short: "Pis" },
] as const;

function signFromLon(lon: number) {
  const idx = Math.floor(normalize360(lon) / 30) % 12;
  return SIGNS[idx];
}

function degMinInSign(lon: number) {
  const x = normalize360(lon);
  const signIdx = Math.floor(x / 30);
  const inSign = x - signIdx * 30;
  const deg = Math.floor(inSign);
  const min = Math.floor((inSign - deg) * 60);
  return { sign: SIGNS[signIdx], deg, min };
}

function fmtPos(lon: number) {
  const { sign, deg, min } = degMinInSign(lon);
  return `${deg}° ${sign.short} ${String(min).padStart(2, "0")}'`;
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

/**
 * ASTRO_SERVICE_URL should be base like "http://127.0.0.1:3002"
 */
function getAstroServiceChartUrl() {
  const raw = process.env.ASTRO_SERVICE_URL || "http://127.0.0.1:3002";
  const base = raw.replace(/\/+$/, "").replace(/\/chart$/, "");
  return `${base}/chart`;
}

async function chartAtUTC(d: Date, latitude: number, longitude: number) {
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
  return { sunLon, moonLon, phaseAngleDeg };
}

function fmtLocalFromUTC(isoUTC: string, tzOffsetMinEast: number) {
  // tzOffsetMinEast: minutes east of UTC. (US Eastern = -300)
  const ms = Date.parse(isoUTC);
  if (!Number.isFinite(ms)) return isoUTC;
  const localMs = ms + tzOffsetMinEast * 60_000;
  const d = new Date(localMs);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  const ss = String(d.getUTCSeconds()).padStart(2, "0");
  return `${y}-${m}-${day} ${hh}:${mm}:${ss}`;
}

/**
 * Find next crossing of phaseAngleDeg to targetDeg using:
 * - coarse stepping (default 6 hours)
 * - then binary search in the bracket
 *
 * This is MUCH faster than the previous “hourly for 40 days for each target”.
 */
async function findNextMarkerFast(params: {
  startUTC: Date;
  targetDeg: number;
  kind: Marker["kind"];
  latitude: number;
  longitude: number;
  tzOffsetMin: number;
}): Promise<Marker | null> {
  const { startUTC, targetDeg, kind, latitude, longitude, tzOffsetMin } = params;

  const maxHours = 40 * 24;
  const stepHours = 6;

  let prevT = new Date(startUTC.getTime());
  let prev = await chartAtUTC(prevT, latitude, longitude);
  let prevDiff = signedDiffDeg(prev.phaseAngleDeg, targetDeg);

  for (let h = stepHours; h <= maxHours; h += stepHours) {
    const t = new Date(startUTC.getTime() + h * 3600_000);
    const cur = await chartAtUTC(t, latitude, longitude);
    const curDiff = signedDiffDeg(cur.phaseAngleDeg, targetDeg);

    // bracketed a sign change -> crossing in [prevT, t]
    if (prevDiff === 0 || curDiff === 0 || (prevDiff < 0 && curDiff > 0) || (prevDiff > 0 && curDiff < 0)) {
      let lo = prevT.getTime();
      let hi = t.getTime();

      // binary search to ~1 minute-ish
      for (let k = 0; k < 18; k++) {
        const mid = Math.floor((lo + hi) / 2);
        const midChart = await chartAtUTC(new Date(mid), latitude, longitude);
        const midDiff = signedDiffDeg(midChart.phaseAngleDeg, targetDeg);

        // keep same-side with prevDiff on lo
        if ((prevDiff <= 0 && midDiff <= 0) || (prevDiff >= 0 && midDiff >= 0)) {
          lo = mid;
          prevDiff = midDiff;
        } else {
          hi = mid;
        }
      }

      const when = new Date(hi);
      const isoUTC = when.toISOString();
      const whenLocal = fmtLocalFromUTC(isoUTC, tzOffsetMin);

      return {
        kind,
        isoUTC,
        whenLocal,
        degreeText: `${targetDeg}°`,
      };
    }

    prevT = t;
    prevDiff = curDiff;
  }

  return null;
}

/**
 * Solar year start = moment Sun crosses 0° Aries (Vernal Equinox).
 * We find it by bracketing around Mar 18–23, then binary searching.
 */
async function findAriesIngressUTC(params: {
  year: number;
  latitude: number;
  longitude: number;
}): Promise<Date> {
  const { year, latitude, longitude } = params;

  // bracket window around equinox
  const start = new Date(Date.UTC(year, 2, 18, 0, 0, 0)); // Mar 18
  const end = new Date(Date.UTC(year, 2, 23, 0, 0, 0)); // Mar 23

  const startChart = await chartAtUTC(start, latitude, longitude);
  const endChart = await chartAtUTC(end, latitude, longitude);

  // We want Sun longitude crossing 0 Aries, i.e. lon wrapping past 360->0.
  // Use signed diff to target 0 and look for sign change.
  let prevT = start;
  let prevDiff = signedDiffDeg(startChart.sunLon, 0);

  // step hourly
  const totalHours = Math.floor((end.getTime() - start.getTime()) / 3600_000);
  for (let i = 1; i <= totalHours; i++) {
    const t = new Date(start.getTime() + i * 3600_000);
    const cur = await chartAtUTC(t, latitude, longitude);
    const curDiff = signedDiffDeg(cur.sunLon, 0);

    if (prevDiff === 0 || curDiff === 0 || (prevDiff < 0 && curDiff > 0) || (prevDiff > 0 && curDiff < 0)) {
      // binary search
      let lo = prevT.getTime();
      let hi = t.getTime();
      for (let k = 0; k < 20; k++) {
        const mid = Math.floor((lo + hi) / 2);
        const midChart = await chartAtUTC(new Date(mid), latitude, longitude);
        const midDiff = signedDiffDeg(midChart.sunLon, 0);
        if ((prevDiff <= 0 && midDiff <= 0) || (prevDiff >= 0 && midDiff >= 0)) {
          lo = mid;
          prevDiff = midDiff;
        } else {
          hi = mid;
        }
      }
      return new Date(hi);
    }

    prevT = t;
    prevDiff = curDiff;
  }

  // Fallback (shouldn't happen): return Mar 20 noon UTC
  return new Date(Date.UTC(year, 2, 20, 12, 0, 0));
}

function ymdFromDateUTC(d: Date) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(
    2,
    "0"
  )}`;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    // Today-only mode: we ignore ymd navigation by default.
    const ymd = searchParams.get("ymd"); // optional YYYY-MM-DD (still supported)
    const tzOffsetMin = Number(searchParams.get("tzOffsetMin") ?? "0"); // minutes east of UTC
    const latitude = Number(searchParams.get("lat") ?? "0");
    const longitude = Number(searchParams.get("lon") ?? "0");

    let asOfUTC = new Date();
    if (ymd && /^\d{4}-\d{2}-\d{2}$/.test(ymd)) {
      const [yy, mm, dd] = ymd.split("-").map(Number);
      asOfUTC = new Date(Date.UTC(yy, mm - 1, dd, 12, 0, 0));
    }

    const { sunLon, moonLon, phaseAngleDeg } = await chartAtUTC(asOfUTC, latitude, longitude);

    const moonSign = signFromLon(moonLon).name;
    const phaseName = phaseNameFromAngle(phaseAngleDeg);

    // Lunar day math
    const synodicMonthDays = 29.530588;
    const lunarAgeDays = (normalize360(phaseAngleDeg) / 360) * synodicMonthDays;
    const lunarDay = Math.max(1, Math.min(30, Math.floor(lunarAgeDays) + 1));

    // === SOLAR YEAR (0° Aries start) ===
    // If date is Jan/Feb/early Mar, solar year start is last year's Aries ingress.
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
    const yearLength = Math.max(1, Math.round((nextSolarYearStart.getTime() - solarYearStart.getTime()) / 86400000));

    const phase = (Math.floor(dayIndexInSolarYear / 45) % 8) + 1; // 1..8
    const dayInPhase = (dayIndexInSolarYear % 45) + 1; // 1..45

    // === FAST MARKERS ===
    const [mNew, mFq, mFull, mLq] = await Promise.all([
      findNextMarkerFast({ startUTC: asOfUTC, targetDeg: 0, kind: "New Moon", latitude, longitude, tzOffsetMin }),
      findNextMarkerFast({ startUTC: asOfUTC, targetDeg: 90, kind: "First Quarter", latitude, longitude, tzOffsetMin }),
      findNextMarkerFast({ startUTC: asOfUTC, targetDeg: 180, kind: "Full Moon", latitude, longitude, tzOffsetMin }),
      findNextMarkerFast({ startUTC: asOfUTC, targetDeg: 270, kind: "Last Quarter", latitude, longitude, tzOffsetMin }),
    ]);

    const markers = [mNew, mFq, mFull, mLq].filter(Boolean) as Marker[];

    const isoAsOf = asOfUTC.toISOString();
    const asOfLocal = fmtLocalFromUTC(isoAsOf, tzOffsetMin) + "Z"; // keep your current “Z vibe” but local clock

    return NextResponse.json({
      ok: true,
      tz: "UTC",
      gregorian: {
        ymd: ymd ? ymd : ymdFromDateUTC(asOfUTC),
        asOfLocal,
      },
      solar: {
        label: `URA Solar • Aries Year Day ${dayIndexInSolarYear}/${yearLength}`,
        kind: "PHASE",
        phase,
        dayInPhase,
        dayIndexInYear: dayIndexInSolarYear,
        yearLength,
        anchors: {
          equinoxLocalDay: fmtLocalFromUTC(solarYearStart.toISOString(), tzOffsetMin),
          nextEquinoxLocalDay: fmtLocalFromUTC(nextSolarYearStart.toISOString(), tzOffsetMin),
        },
      },
      lunar: {
        phaseName,
        label: `Lunar • ${phaseName}`,
        lunarDay,
        lunarAgeDays: Math.round(lunarAgeDays * 100) / 100,
        synodicMonthDays,
        phaseAngleDeg: Math.round(phaseAngleDeg * 10) / 10,
      },
      astro: {
        sunPos: fmtPos(sunLon),
        sunLon: Math.round(normalize360(sunLon) * 1000) / 1000,
        moonPos: fmtPos(moonLon),
        moonSign,
        moonEntersSign: moonSign,
        moonEntersSignLocal: "—",
        moonEntersLocal: "—",
      },
      lunation: { markers },
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}
