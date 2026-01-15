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
 * Solar URA (0° Aries start):
 * 360° / 8 = 45° per phase
 * Phase 1: 0°..45° (Aries+)
 * ...
 * Phase 7: 270°..315° (Capricorn zone)
 */
function solarPhaseFromSunLon(sunLon: number) {
  const lon = normalize360(sunLon);
  const phaseIndex0 = Math.floor(lon / 45); // 0..7
  const phase = phaseIndex0 + 1; // 1..8
  const startDeg = phaseIndex0 * 45;
  const withinDeg = lon - startDeg; // 0..45
  const progress01 = withinDeg / 45;

  // Map the 45° span to 45 "days" (your UI expects Day X of 45)
  const dayInPhase = Math.min(45, Math.max(1, Math.floor(progress01 * 45) + 1));

  return { phase, dayInPhase, progress01, startDeg, withinDeg };
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
    const t = await r.text().catch(() => "");
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

function ymdFromDateUTC(d: Date) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(
    d.getUTCDate()
  ).padStart(2, "0")}`;
}

function isLeapYear(y: number) {
  return y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0);
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    // TODAY-ONLY:
    // - ignore navigation / ymd, always use "now"
    // (keep ymd support anyway, for debugging)
    const ymd = searchParams.get("ymd"); // optional YYYY-MM-DD debug
    const latitude = Number(searchParams.get("lat") ?? "0");
    const longitude = Number(searchParams.get("lon") ?? "0");

    let asOfUTC = new Date();
    if (ymd && /^\d{4}-\d{2}-\d{2}$/.test(ymd)) {
      const [yy, mm, dd] = ymd.split("-").map(Number);
      asOfUTC = new Date(Date.UTC(yy, mm - 1, dd, 12, 0, 0));
    }

    const { sunLon, moonLon, phaseAngleDeg } = await chartAtUTC(asOfUTC, latitude, longitude);

    const moonSign = signFromLon(moonLon).name;
    const sunSign = signFromLon(sunLon).name;

    const phaseName = phaseNameFromAngle(phaseAngleDeg);

    const synodicMonthDays = 29.530588;
    const lunarAgeDays = (normalize360(phaseAngleDeg) / 360) * synodicMonthDays;
    const lunarDay = Math.max(1, Math.min(30, Math.floor(lunarAgeDays) + 1));

    // Correct Solar URA phase (0° Aries start)
    const solar = solarPhaseFromSunLon(sunLon);

    // Keep your day-of-year display (calendar day count), but solar phase is now independent
    const y = asOfUTC.getUTCFullYear();
    const yearLength = isLeapYear(y) ? 366 : 365;
    const dayIndexInYear =
      Math.floor(
        (Date.UTC(y, asOfUTC.getUTCMonth(), asOfUTC.getUTCDate()) - Date.UTC(y, 0, 1)) / 86400000
      ) + 1; // 1-based for UI

    // TODAY-ONLY: no marker scanning (that’s what was killing load time)
    const markers: Marker[] = [];

    return NextResponse.json(
      {
        ok: true,
        tz: "UTC",
        gregorian: {
          ymd: ymd ? ymd : ymdFromDateUTC(asOfUTC),
          asOfLocal: asOfUTC.toISOString(), // keep raw ISO, UI can format
        },
        solar: {
          label: `Solar • Phase ${solar.phase}`,
          kind: "PHASE",
          phase: solar.phase,
          dayInPhase: solar.dayInPhase,
          phaseProgress01: Number(solar.progress01.toFixed(4)),
          dayIndexInYear,
          yearLength,
          // debug/support:
          sunLon: Number(normalize360(sunLon).toFixed(3)),
          sunSign,
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
          sunLon: Number(normalize360(sunLon).toFixed(3)),
          sunSign,
          moonPos: fmtPos(moonLon),
          moonLon: Number(normalize360(moonLon).toFixed(3)),
          moonSign,
          moonEntersSign: moonSign,
          moonEntersSignLocal: "—",
          moonEntersLocal: "—",
        },
        lunation: { markers },
        meta: {
          todayOnly: true,
          note: "Markers disabled for speed. Enable later with cached monthly calcs if needed.",
        },
      },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}
