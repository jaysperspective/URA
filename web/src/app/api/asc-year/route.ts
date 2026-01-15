// src/app/api/asc-year/route.ts
import { NextRequest, NextResponse } from "next/server";
import { withComputeRateLimit } from "@/lib/withRateLimit";

function normDeg(v: number) {
  const x = v % 360;
  return x < 0 ? x + 360 : x;
}

function num(v: any): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function getLocalDayKey(timezone: string, d = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);

  const y = parts.find((p) => p.type === "year")?.value;
  const m = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;

  if (!y || !m || !day) throw new Error("Could not compute local day key.");
  return `${y}-${m}-${day}`;
}

/**
 * Convert a "wall clock" local time in a timezone into a UTC Date.
 */
function zonedLocalToUtcDate(opts: {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  timezone: string;
}) {
  const { year, month, day, hour, minute, timezone } = opts;

  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
  const asZonedString = utcGuess.toLocaleString("en-US", { timeZone: timezone });
  const asZonedDate = new Date(asZonedString);
  const diffMs = utcGuess.getTime() - asZonedDate.getTime();

  return new Date(utcGuess.getTime() + diffMs);
}

async function fetchChart(payload: {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  latitude: number;
  longitude: number;
}) {
  const base = process.env.ASTRO_SERVICE_URL;
  if (!base) throw new Error("ASTRO_SERVICE_URL is missing.");

  const r = await fetch(`${base}/chart`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!r.ok) {
    const txt = await r.text().catch(() => "");
    throw new Error(`astro-service /chart failed: ${r.status} ${txt.slice(0, 200)}`);
  }

  return r.json();
}

function getAscLon(natalJson: any): number | null {
  return (
    num(natalJson?.data?.ascendant) ??
    num(natalJson?.data?.angles?.asc) ??
    num(natalJson?.data?.angles?.ascendant) ??
    num(natalJson?.data?.houses?.ascendant) ??
    num(natalJson?.ascendant) ??
    num(natalJson?.angles?.asc) ??
    null
  );
}

function getSunLon(chartJson: any): number | null {
  return (
    num(chartJson?.data?.planets?.sun?.lon) ??
    num(chartJson?.data?.planets?.sun) ??
    num(chartJson?.planets?.sun?.lon) ??
    num(chartJson?.planets?.sun) ??
    null
  );
}

function seasonFromCyclePos(cyclePos: number) {
  const p = normDeg(cyclePos);
  if (p < 90) return "Spring";
  if (p < 180) return "Summer";
  if (p < 270) return "Fall";
  return "Winter";
}

// 0–30 cardinal, 30–60 fixed, 60–90 mutable, repeating each season
function modalityFromWithinSeason(degIntoSeason0to90: number) {
  const x = degIntoSeason0to90 % 90;
  if (x < 30) return "Cardinal";
  if (x < 60) return "Fixed";
  return "Mutable";
}

function phaseIndex45(cyclePos: number) {
  return Math.floor(normDeg(cyclePos) / 45); // 0..7
}

function parseAsOfDateKey(s: any) {
  if (typeof s !== "string") return null;
  const t = s.trim();
  // YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) return null;
  return t;
}

async function handlePost(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as any;

    const timezone = typeof body?.timezone === "string" ? body.timezone : "America/New_York";

    // LOCAL birth fields (source of truth)
    const year = num(body?.year);
    const month = num(body?.month);
    const day = num(body?.day);
    const hour = num(body?.hour);
    const minute = num(body?.minute);

    const lat = num(body?.lat ?? body?.latitude);
    const lon = num(body?.lon ?? body?.longitude);

    if (
      year == null ||
      month == null ||
      day == null ||
      hour == null ||
      minute == null ||
      lat == null ||
      lon == null
    ) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields: year,month,day,hour,minute, lat/lon, timezone" },
        { status: 400 }
      );
    }

    // Birth time: local → UTC for astro-service
    const birthUTC = zonedLocalToUtcDate({
      year,
      month,
      day,
      hour,
      minute,
      timezone,
    });

    const birthPayloadUTC = {
      year: birthUTC.getUTCFullYear(),
      month: birthUTC.getUTCMonth() + 1,
      day: birthUTC.getUTCDate(),
      hour: birthUTC.getUTCHours(),
      minute: birthUTC.getUTCMinutes(),
      latitude: lat,
      longitude: lon,
    };

    // as-of: stable daily moment
    const asOfKey = parseAsOfDateKey(body?.asOfDate) ?? getLocalDayKey(timezone);
    const [Y, M, D] = asOfKey.split("-").map((x) => Number(x));

    // choose local noon to avoid boundary jitter
    const asOfUTC = zonedLocalToUtcDate({
      year: Y,
      month: M,
      day: D,
      hour: 12,
      minute: 0,
      timezone,
    });

    const asOfPayloadUTC = {
      year: asOfUTC.getUTCFullYear(),
      month: asOfUTC.getUTCMonth() + 1,
      day: asOfUTC.getUTCDate(),
      hour: asOfUTC.getUTCHours(),
      minute: asOfUTC.getUTCMinutes(),
      latitude: lat,
      longitude: lon,
    };

    const [natal, asof] = await Promise.all([
      fetchChart(birthPayloadUTC),
      fetchChart(asOfPayloadUTC),
    ]);

    const natalAscLon = getAscLon(natal);
    const transitingSunLon = getSunLon(asof);

    if (natalAscLon == null || transitingSunLon == null) {
      return NextResponse.json(
        { ok: false, error: "Could not derive natalAscLon/transitingSunLon" },
        { status: 502 }
      );
    }

    // Core
    const cyclePositionDeg = normDeg(transitingSunLon - natalAscLon);

    const season = seasonFromCyclePos(cyclePositionDeg);
    const degIntoSeason = normDeg(cyclePositionDeg) % 90;
    const modality = modalityFromWithinSeason(degIntoSeason);
    const degreesIntoModality = degIntoSeason % 30;

    const p45 = phaseIndex45(cyclePositionDeg); // 0..7

    return NextResponse.json({
      ok: true,
      ascYear: {
        timezone,
        asOfDayKey: asOfKey,

        natalAscLon,
        transitingSunLon,
        cyclePositionDeg,

        season,
        modality,
        degreesIntoModality,

        // 8×45 lens
        phaseIndex45: p45,
        phaseId45: p45 + 1,
        degIntoPhase45: cyclePositionDeg % 45,
        phaseProgress01: (cyclePositionDeg % 45) / 45,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Unknown error" },
      { status: 500 }
    );
  }
}

export const POST = withComputeRateLimit(handlePost);
