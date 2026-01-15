// web/src/lib/calendar/astro.ts
import { fetchChart } from "@/lib/astro/client";

export type SunMoon = { sunLon: number; moonLon: number; julianDay?: number };

export async function fetchSunMoonLongitudesUTC(dt: Date): Promise<SunMoon> {
  // dt is a UTC instant; we pass UTC components to astro-service
  const year = dt.getUTCFullYear();
  const month = dt.getUTCMonth() + 1;
  const day = dt.getUTCDate();
  const hour = dt.getUTCHours();
  const minute = dt.getUTCMinutes();

  const response = await fetchChart({
    year,
    month,
    day,
    hour,
    minute,
    latitude: 0,
    longitude: 0,
  });

  if (!response.ok || !response.data) {
    throw new Error(response.error || "astro-service /chart failed");
  }

  // Matches your live response shape:
  // json.data.planets.sun.lon
  // json.data.planets.moon.lon
  const sunLon = response.data.planets?.sun?.lon;
  const moonLon = response.data.planets?.moon?.lon;

  if (typeof sunLon !== "number" || typeof moonLon !== "number") {
    throw new Error(
      "astro-service response missing data.planets.sun.lon / data.planets.moon.lon"
    );
  }

  return { sunLon, moonLon, julianDay: response.data.julianDay };
}

export function norm360(x: number) {
  const n = x % 360;
  return n < 0 ? n + 360 : n;
}
