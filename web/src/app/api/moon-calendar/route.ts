import { NextResponse } from "next/server";

type DayRow = {
  dateISO: string; // YYYY-MM-DD
  day: number; // 1..31
  illuminationPct: number; // 0..100
  phaseAngleDeg: number; // 0..360 (0=new, 180=full)
  moonLon: number; // 0..360
  moonSign: string; // Aries..Pisces
  moonSignGlyph: string; // ♈︎..♓︎
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

// illuminated fraction = (1 - cos(elongation)) / 2
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

// Must match your astro-service chart endpoint (same one /api/lunation uses)
const ASTRO_SERVICE_URL =
  process.env.ASTRO_SERVICE_URL || "http://127.0.0.1:3002/chart";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const year = Number(searchParams.get("year"));
    const month = Number(searchParams.get("month")); // 1..12
    const tzOffsetMin = Number(searchParams.get("tzOffsetMin") ?? "0"); // minutes east of UTC
    const latitude = Number(searchParams.get("lat") ?? "0");
    const longitude = Number(searchParams.get("lon") ?? "0");

    if (!year || !month || month < 1 || month > 12) {
      return NextResponse.json(
        { ok: false, error: "Missing/invalid year or month (month is 1..12)" },
        { status: 400 }
      );
    }

    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const rows: DayRow[] = [];

    // Sample at local noon for stable daily snapshots
    const localHour = 12;
    const localMinute = 0;

    for (let d = 1; d <= daysInMonth; d++) {
      // construct "local time" then shift to UTC using tzOffsetMin
      const localAsUTC = Date.UTC(year, month - 1, d, localHour, localMinute, 0);
      const utcMs = localAsUTC - tzOffsetMin * 60_000;
      const utcDate = new Date(utcMs);

      const payload = {
        year: utcDate.getUTCFullYear(),
        month: utcDate.getUTCMonth() + 1,
        day: utcDate.getUTCDate(),
        hour: utcDate.getUTCHours(),
        minute: utcDate.getUTCMinutes(),
        latitude,
        longitude,
      };

      const r = await fetch(ASTRO_SERVICE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        cache: "no-store",
      });

      if (!r.ok) {
        const t = await r.text();
        throw new Error(`astro-service error (${r.status}): ${t.slice(0, 200)}`);
      }

      const json = await r.json();
      const sunLon = json?.data?.planets?.sun?.lon;
      const moonLon = json?.data?.planets?.moon?.lon;

      if (typeof sunLon !== "number" || typeof moonLon !== "number") {
        throw new Error("astro-service response missing sun/moon lon");
      }

      const phaseAngleDeg = normalize360(moonLon - sunLon);
      const illum = illuminationFromPhaseAngle(phaseAngleDeg);
      const sign = moonSignFromLon(moonLon);

      const dateISO = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(
        2,
        "0"
      )}`;

      rows.push({
        dateISO,
        day: d,
        illuminationPct: Math.round(illum * 1000) / 10, // 1 decimal
        phaseAngleDeg: Math.round(phaseAngleDeg * 10) / 10,
        moonLon: Math.round(normalize360(moonLon) * 1000) / 1000,
        moonSign: sign.name,
        moonSignGlyph: sign.glyph,
      });
    }

    return NextResponse.json({
      ok: true,
      input: { year, month, tzOffsetMin, latitude, longitude },
      daysInMonth,
      rows,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
