import { NextResponse } from "next/server";

function buildOrigin(req: Request) {
  const url = new URL(req.url);
  const host =
    req.headers.get("x-forwarded-host") ||
    req.headers.get("host") ||
    url.host;
  const proto =
    req.headers.get("x-forwarded-proto") ||
    url.protocol.replace(":", "") ||
    "http";
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
      return { ok: false, status: 502, json: { ok: false, error: "Non-JSON response" } };
    }
  } catch (e: any) {
    return { ok: false, status: 502, json: { ok: false, error: e?.message ?? "fetch failed" } };
  }
}

export async function GET(req: Request) {
  const origin = buildOrigin(req);

  // Pull from the endpoints that actually exist
  const [lun, moonCal] = await Promise.all([
    safeFetchJson(`${origin}/api/lunation`),
    safeFetchJson(`${origin}/api/moon-calendar`),
  ]);

  // If lunation fails, still return JSON with a safe astro object
  const astroFromLun =
    lun.ok && lun.json?.ok === true
      ? (lun.json.astro ?? lun.json.data?.astro ?? null)
      : null;

  const astro =
    astroFromLun && typeof astroFromLun === "object"
      ? astroFromLun
      : {
          // SAFE defaults so the client won’t crash
          moonSign: null,
          sunSign: null,
        };

  // If moon-calendar fails, keep it but don’t break the whole response
  const moon = moonCal.ok ? moonCal.json : { ok: false, error: moonCal.json?.error ?? "fetch failed" };

  return NextResponse.json({
    ok: true,
    astro,
    lunation: lun.json,
    moonCalendar: moon,
    meta: {
      lunationOk: lun.ok && lun.json?.ok === true,
      moonCalendarOk: moonCal.ok && moonCal.json?.ok === true,
    },
  });
}
