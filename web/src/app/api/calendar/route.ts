// src/app/api/calendar/route.ts
import { NextResponse } from "next/server";

function buildOrigin(req: Request) {
  const url = new URL(req.url);
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || url.host;
  const proto = req.headers.get("x-forwarded-proto") || url.protocol.replace(":", "") || "http";
  return `${proto}://${host}`;
}

async function safeFetchJson(url: string) {
  try {
    const res = await fetch(url, {
      cache: "no-store",
      headers: { accept: "application/json" },
    });
    const text = await res.text();
    try {
      const json = JSON.parse(text);
      return { ok: res.ok, status: res.status, json };
    } catch {
      return {
        ok: false,
        status: 502,
        json: { ok: false, error: "Non-JSON response" },
      };
    }
  } catch (e: any) {
    return {
      ok: false,
      status: 502,
      json: { ok: false, error: e?.message ?? "fetch failed" },
    };
  }
}

function isCalendarBase(x: any) {
  // minimal fields your clients require
  return (
    x &&
    typeof x === "object" &&
    x.ok === true &&
    typeof x.tz === "string" &&
    x.gregorian &&
    typeof x.gregorian.ymd === "string" &&
    typeof x.gregorian.asOfLocal === "string" &&
    x.solar &&
    typeof x.solar.label === "string" &&
    x.lunar &&
    typeof x.lunar.phaseName === "string" &&
    typeof x.lunar.label === "string" &&
    x.astro &&
    typeof x.astro.moonSign === "string" &&
    typeof x.astro.moonPos === "string"
  );
}

function extractMarkers(lunJson: any) {
  // accept multiple historical shapes
  const m1 = lunJson?.lunation?.markers;
  const m2 = lunJson?.data?.lunation?.markers;
  const m3 = lunJson?.markers; // fallback if ever flat
  const markers = (Array.isArray(m1) ? m1 : Array.isArray(m2) ? m2 : Array.isArray(m3) ? m3 : null) ?? [];

  // Ensure marker objects are shaped like {kind, whenLocal, degreeText, isoUTC}
  return markers.filter(
    (m: any) =>
      m &&
      typeof m === "object" &&
      typeof m.kind === "string" &&
      typeof m.whenLocal === "string" &&
      typeof m.degreeText === "string" &&
      typeof m.isoUTC === "string"
  );
}

export async function GET(req: Request) {
  const origin = buildOrigin(req);

  const [moonCal, lun] = await Promise.all([
    safeFetchJson(`${origin}/api/moon-calendar`),
    safeFetchJson(`${origin}/api/lunation`),
  ]);

  // Prefer moon-calendar as the base (it should contain gregorian/solar/lunar/astro)
  const base = moonCal.ok ? moonCal.json : null;

  if (!isCalendarBase(base)) {
    // Try a second fallback: sometimes lunation might contain a full calendar-like payload
    const alt = lun.ok ? lun.json : null;

    if (isCalendarBase(alt)) {
      const markers = extractMarkers(lun.json);
      return NextResponse.json(
        {
          ...alt,
          lunation: { markers },
          meta: {
            source: "lunation",
            moonCalendarOk: moonCal.ok && moonCal.json?.ok === true,
            lunationOk: lun.ok && lun.json?.ok === true,
          },
        },
        { status: 200 }
      );
    }

    // Hard fail with ok:false so clients show a clean error banner
    return NextResponse.json(
      {
        ok: false,
        error: "Malformed /api/moon-calendar payload (missing expected fields).",
        meta: {
          moonCalendarStatus: moonCal.status,
          lunationStatus: lun.status,
          moonCalendarOk: moonCal.ok && moonCal.json?.ok === true,
          lunationOk: lun.ok && lun.json?.ok === true,
          moonCalendarError: moonCal.json?.error ?? null,
          lunationError: lun.json?.error ?? null,
        },
      },
      { status: 502 }
    );
  }

  // Merge lunation markers into the base calendar payload
  const markers = lun.ok && lun.json?.ok === true ? extractMarkers(lun.json) : [];

  return NextResponse.json(
    {
      ...base,
      lunation: { markers },
      meta: {
        source: "moon-calendar",
        moonCalendarOk: moonCal.ok && moonCal.json?.ok === true,
        lunationOk: lun.ok && lun.json?.ok === true,
      },
    },
    { status: 200 }
  );
}
