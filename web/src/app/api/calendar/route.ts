// src/app/api/calendar/route.ts
import { NextResponse } from "next/server";

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

function signedDiffDeg(a: number, target: number) {
  // returns [-180,180)
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
  // 8 main names
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
 * IMPORTANT:
 * - ASTRO_SERVICE_URL should be base like "http://127.0.0.1:3002"
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
    throw new Error(`astro-service error (${r.status}) ${t.slice(0, 160)}`);
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

async function findNextMarker(params: {
  startUTC: Date;
  targetDeg: number;
  kind: Marker["kind"];
  latitude: number;
  longitude: number;
}): Promise<Marker | null> {
  const { startUTC, targetDeg, kind, latitude, longitude } = params;

  // Step forward hourly up to 40 days looking for a sign change around the target
  const maxHours = 40 * 24;
  let prevT = new Date(startUTC.getTime());
  let prev = await chartAtUTC(prevT, latitude, longitude);
  let prevDiff = signedDiffDeg(prev.phaseAngleDeg, targetDeg);

  for (let i = 1; i <= maxHours; i++) {
    const t = new Date(startUTC.getTime() + i * 3600_000);
    const cur = await chartAtUTC(t, latitude, longitude);
    const curDiff = signedDiffDeg(cur.phaseAngleDeg, targetDeg);

    // Found crossing interval
    if (prevDiff === 0 || curDiff === 0 || (prevDiff < 0 && curDiff > 0) || (prevDiff > 0 && curDiff < 0)) {
      // Binary search to ~minute precision
      let lo = prevT.getTime();
      let hi = t.getTime();
      for (let k = 0; k < 18; k++) {
        const mid = Math.floor((lo + hi) / 2);
        const midChart = await chartAtUTC(new Date(mid), latitude, longitude);
        const midDiff = signedDiffDeg(midChart.phaseAngleDeg, targetDeg);

        // move toward the sign change
        if ((prevDiff <= 0 && midDiff <= 0) || (prevDiff >= 0 && midDiff >= 0)) {
          lo = mid;
          prevDiff = midDiff;
        } else {
          hi = mid;
        }
      }

      const when = new Date(hi);
      const isoUTC = when.toISOString();
      // You can later swap this to a real local-time formatter if you pass a tz.
      const whenLocal = isoUTC.replace("T", " ").replace(".000Z", " UTC");

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

function ymdFromDateUTC(d: Date) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const ymd = searchParams.get("ymd"); // optional YYYY-MM-DD
    const latitude = Number(searchParams.get("lat") ?? "0");
    const longitude = Number(searchParams.get("lon") ?? "0");

    // Choose asOfUTC:
    // - if ymd provided: use that date at 12:00 UTC (stable)
    // - else: now
    let asOfUTC = new Date();
    if (ymd && /^\d{4}-\d{2}-\d{2}$/.test(ymd)) {
      const [yy, mm, dd] = ymd.split("-").map(Number);
      asOfUTC = new Date(Date.UTC(yy, mm - 1, dd, 12, 0, 0));
    }

    const { sunLon, moonLon, phaseAngleDeg } = await chartAtUTC(asOfUTC, latitude, longitude);

    const moonSign = signFromLon(moonLon).name;
    const phaseName = phaseNameFromAngle(phaseAngleDeg);

    const synodicMonthDays = 29.530588;
    const lunarAgeDays = (normalize360(phaseAngleDeg) / 360) * synodicMonthDays;
    const lunarDay = Math.max(1, Math.min(30, Math.floor(lunarAgeDays) + 1));

    // Build markers (next occurrences from asOf)
    const [mNew, mFq, mFull, mLq] = await Promise.all([
      findNextMarker({ startUTC: asOfUTC, targetDeg: 0, kind: "New Moon", latitude, longitude }),
      findNextMarker({ startUTC: asOfUTC, targetDeg: 90, kind: "First Quarter", latitude, longitude }),
      findNextMarker({ startUTC: asOfUTC, targetDeg: 180, kind: "Full Moon", latitude, longitude }),
      findNextMarker({ startUTC: asOfUTC, targetDeg: 270, kind: "Last Quarter", latitude, longitude }),
    ]);

    const markers = [mNew, mFq, mFull, mLq].filter(Boolean) as Marker[];

    // Minimal-but-stable solar fields (placeholder clock)
    // (You can later wire in the true URA solar clock logic.)
    const dayIndexInYear = Math.floor((Date.UTC(asOfUTC.getUTCFullYear(), asOfUTC.getUTCMonth(), asOfUTC.getUTCDate()) - Date.UTC(asOfUTC.getUTCFullYear(), 0, 1)) / 86400000);
    const yearLength = 365 + (asOfUTC.getUTCFullYear() % 4 === 0 && (asOfUTC.getUTCFullYear() % 100 !== 0 || asOfUTC.getUTCFullYear() % 400 === 0) ? 1 : 0);

    return NextResponse.json({
      ok: true,
      tz: "UTC",
      gregorian: {
        ymd: ymd ? ymd : ymdFromDateUTC(asOfUTC),
        asOfLocal: asOfUTC.toISOString().replace("T", " ").replace(".000Z", " UTC"),
      },
      solar: {
        label: `URA Solar (placeholder) • ${ymd ? ymd : ymdFromDateUTC(asOfUTC)}`,
        kind: "PHASE",
        phase: 1,
        dayInPhase: 1,
        dayIndexInYear,
        yearLength,
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
