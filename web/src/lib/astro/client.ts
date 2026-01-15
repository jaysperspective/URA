// src/lib/astro/client.ts
// Astro service client with automatic mock fallback for development

import {
  generateMockChartResponse,
  isMockEnabled,
  MockChartParams,
  ChartResponse,
} from "./mockData";

const ASTRO_URL = process.env.ASTRO_SERVICE_URL || "http://127.0.0.1:3002";
const FETCH_TIMEOUT_MS = 5000;

/**
 * Fetch a chart from the astro service with timeout and mock fallback.
 *
 * In development: Returns mock data if the service is unavailable.
 * In production: Throws an error if the service fails.
 */
export async function fetchChart(params: MockChartParams): Promise<ChartResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(`${ASTRO_URL}/chart`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
      signal: controller.signal,
      cache: "no-store",
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(
        `astro-service /chart failed: ${res.status} ${text.slice(0, 200)}`
      );
    }

    return await res.json();
  } catch (err: unknown) {
    clearTimeout(timeoutId);

    // Check if mock mode is enabled and we should fallback
    if (isMockEnabled()) {
      console.warn(
        `[astro-client] Service unavailable, using mock data. Error: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
      return generateMockChartResponse(params);
    }

    // Re-throw in production or when mock is disabled
    throw err;
  }
}

/**
 * Safe version of fetchChart that never throws.
 * Returns an error response instead of throwing.
 */
export async function fetchChartSafe(params: MockChartParams): Promise<ChartResponse> {
  try {
    return await fetchChart(params);
  } catch (err) {
    if (isMockEnabled()) {
      return generateMockChartResponse(params);
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

/**
 * Fetch natal chart data (alias for fetchChart with standard parameters).
 */
export async function fetchNatalChart(params: {
  year: number;
  month: number;
  day: number;
  hour?: number;
  minute?: number;
  latitude: number;
  longitude: number;
}): Promise<ChartResponse> {
  return fetchChart({
    year: params.year,
    month: params.month,
    day: params.day,
    hour: params.hour ?? 0,
    minute: params.minute ?? 0,
    latitude: params.latitude,
    longitude: params.longitude,
  });
}

/**
 * Check if the astro service is available.
 */
export async function isAstroServiceAvailable(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const res = await fetch(ASTRO_URL, {
      method: "GET",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) return false;

    const data = await res.json();
    return data.ok === true;
  } catch {
    return false;
  }
}
