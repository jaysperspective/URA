// web/src/lib/calendar/astro.ts
const ASTRO_URL = process.env.ASTRO_SERVICE_URL || "http://127.0.0.1:3002";

export type SunMoon = { sunLon: number; moonLon: number; julianDay?: number };

export async function fetchSunMoonLongitudesUTC(dt: Date): Promise<SunMoon> {
  // dt is UTC instant; pass UTC components to astro-service
  const year = dt.getUTCFullYear();
  const month = dt.getUTCMonth() + 1;
  const day = dt.getUTCDate();
  const hour = dt.getUTCHours();
  const minute = dt.getUTCMinutes();

  const body = {
    year,
    month,
    day,
    hour,
    minute,
    latitude: 0,
    longitude: 0,
  };

  const res = await fetch(`${ASTRO_URL}/chart`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`astro-service /chart failed: ${res.status}`);
  }

  const json: any = await res.json();
  const sunLon = json?.data?.planets?.sun?.lon ?? json?.data?.planets?.Sun?.lon;
  const moonLon = json?.data?.planets?.moon?.lon ?? json?.data?.planets?.Moon?.lon;

  if (typeof sunLon !== "number" || typeof moonLon !== "number") {
    throw new Error("astro-service response missing data.planets.sun.lon / moon.lon");
  }

  return { sunLon, moonLon, julianDay: json?.data?.julianDay };
}

export function norm360(x: number) {
  const n = x % 360;
  return n < 0 ? n + 360 : n;
}
