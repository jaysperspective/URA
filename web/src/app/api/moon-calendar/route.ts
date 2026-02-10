// src/app/api/moon-calendar/route.ts
import { NextRequest, NextResponse } from "next/server";
import { withStandardRateLimit } from "@/lib/withRateLimit";

export const runtime = "nodejs";

type DayRow = {
  dateISO: string;
  day: number;
  illuminationPct: number;
  phaseAngleDeg: number;
  moonLon: number;
  moonSign: string;
  moonSignGlyph: string;
};

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

function normalize360(deg: number) {
  const v = deg % 360;
  return v < 0 ? v + 360 : v;
}

function rad(deg: number) {
  return (deg * Math.PI) / 180;
}

function illuminationFromPhaseAngle(phaseAngleDeg: number) {
  const frac = (1 - Math.cos(rad(phaseAngleDeg))) / 2;
  return clamp01(frac);
}

const SIGNS = [
  { name: "Aries", glyph: "♈︎" },
  { name: "Taurus", glyph: "♉︎" },
  { name: "Gemini", glyph: "♊︎" },
  { name: "Cancer", glyph: "♋︎" },
  { name: "Leo", glyph: "♌︎" },
  { name: "Virgo", glyph: "♍︎" },
  { name: "Libra", glyph: "♎︎" },
  { name: "Scorpio", glyph: "♏︎" },
  { name: "Sagittarius", glyph: "♐︎" },
  { name: "Capricorn", glyph: "♑︎" },
  { name: "Aquarius", glyph: "♒︎" },
  { name: "Pisces", glyph: "♓︎" },
] as const;

function moonSignFromLon(lon: number) {
  const idx = Math.floor(normalize360(lon) / 30) % 12;
  return SIGNS[idx];
}

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
  });

  if (!r.ok) {
    const t = await r.text().catch(() => "");
    throw new Error(`astro-service error (${r.status}) at ${chartUrl}: ${t.slice(0, 160)}`);
  }

  const json = await r.json();
  const sunLon = json?.data?.planets?.sun?.lon;
  const moonLon = json?.data?.planets?.moon?.lon;

  if (typeof sunLon !== "number" || typeof moonLon !== "number") {
    throw new Error("astro-service response missing sun/moon lon");
  }

  return { sunLon, moonLon };
}

// Simple in-memory cache (fine for a single droplet instance)
type CacheVal = { at: number; data: any };
const CACHE = new Map<string, CacheVal>();
const CACHE_TTL_MS = 5 * 60_000; // 5 minutes

function cacheKey(input: any) {
  return JSON.stringify(input);
}

async function runWithConcurrency<T>(tasks: (() => Promise<T>)[], concurrency: number) {
  const results: T[] = new Array(tasks.length);
  let idx = 0;

  async function worker() {
    while (true) {
      const i = idx++;
      if (i >= tasks.length) return;
      results[i] = await tasks[i]();
    }
  }

  const workers = Array.from({ length: Math.max(1, concurrency) }, () => worker());
  await Promise.all(workers);
  return results;
}

async function handleGet(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const now = new Date();
    const defaultYear = now.getUTCFullYear();
    const defaultMonth = now.getUTCMonth() + 1;

    const year = Number(searchParams.get("year") ?? defaultYear);
    const month = Number(searchParams.get("month") ?? defaultMonth);
    const tzOffsetMin = Number(searchParams.get("tzOffsetMin") ?? "0");
    const latitude = Number(searchParams.get("lat") ?? "0");
    const longitude = Number(searchParams.get("lon") ?? "0");

    if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
      return NextResponse.json({ ok: false, error: "Missing/invalid year or month (month is 1..12)" }, { status: 400 });
    }

    const input = { year, month, tzOffsetMin, latitude, longitude };
    const key = cacheKey(input);
    const hit = CACHE.get(key);
    if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
      return NextResponse.json(hit.data, { status: 200, headers: { "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=300" } });
    }

    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

    // Sample at local noon
    const localHour = 12;
    const localMinute = 0;

    const tasks = Array.from({ length: daysInMonth }, (_, i) => {
      const d = i + 1;

      return async () => {
        const localAsUTC = Date.UTC(year, month - 1, d, localHour, localMinute, 0);
        const utcMs = localAsUTC - tzOffsetMin * 60_000;
        const utcDate = new Date(utcMs);

        const { sunLon, moonLon } = await chartAtUTC(utcDate, latitude, longitude);

        const phaseAngleDeg = normalize360(moonLon - sunLon);
        const illum = illuminationFromPhaseAngle(phaseAngleDeg);
        const sign = moonSignFromLon(moonLon);

        const dateISO = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

        const row: DayRow = {
          dateISO,
          day: d,
          illuminationPct: Math.round(illum * 1000) / 10,
          phaseAngleDeg: Math.round(phaseAngleDeg * 10) / 10,
          moonLon: Math.round(normalize360(moonLon) * 1000) / 1000,
          moonSign: sign.name,
          moonSignGlyph: sign.glyph,
        };

        return row;
      };
    });

    const rows = await runWithConcurrency(tasks, 6);

    const data = {
      ok: true,
      input,
      daysInMonth,
      rows,
    };

    CACHE.set(key, { at: Date.now(), data });

    return NextResponse.json(data, { status: 200, headers: { "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=300" } });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}

export const GET = withStandardRateLimit(handleGet);
