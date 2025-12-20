// web/src/app/api/geocode/route.ts
import { NextResponse } from "next/server";

/**
 * Simple Nominatim geocoder proxy with in-memory caching.
 * Input:  { q: "Danville, VA" }
 * Output: { ok: true, lat, lon, display_name, source: "nominatim", cached?: true }
 */

const GEOCODE_CACHE_VERSION = "geocode:v1";
const GEOCODE_TTL_MS = 24 * 60 * 60 * 1000; // 24h
type CacheEntry = { expiresAt: number; payload: any };
const GEOCODE_CACHE: Map<string, CacheEntry> =
  (globalThis as any).__URA_GEOCODE_CACHE__ ?? new Map<string, CacheEntry>();
(globalThis as any).__URA_GEOCODE_CACHE__ = GEOCODE_CACHE;

function getCache(key: string) {
  const hit = GEOCODE_CACHE.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) {
    GEOCODE_CACHE.delete(key);
    return null;
  }
  return hit.payload;
}

function setCache(key: string, payload: any) {
  if (GEOCODE_CACHE.size > 1000) {
    const now = Date.now();
    for (const [k, v] of GEOCODE_CACHE) {
      if (now > v.expiresAt) GEOCODE_CACHE.delete(k);
      if (GEOCODE_CACHE.size <= 800) break;
    }
  }
  GEOCODE_CACHE.set(key, { expiresAt: Date.now() + GEOCODE_TTL_MS, payload });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as any;
    const q = typeof body?.q === "string" ? body.q.trim() : "";

    if (!q) {
      return NextResponse.json(
        { ok: false, error: 'Missing q. Example: { "q": "Danville, VA" }' },
        { status: 400 }
      );
    }

    const cacheKey = `${GEOCODE_CACHE_VERSION}|${q.toLowerCase()}`;
    const cached = getCache(cacheKey);
    if (cached) {
      return NextResponse.json({ ...cached, cached: true });
    }

    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("q", q);
    url.searchParams.set("limit", "1");
    url.searchParams.set("addressdetails", "1");

    const res = await fetch(url.toString(), {
      method: "GET",
      headers: {
        // Nominatim requires a User-Agent identifying your app
        "User-Agent": "URA-Geocoder/1.0",
        "Accept-Language": "en",
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { ok: false, error: `Geocoder error: HTTP ${res.status}` },
        { status: 502 }
      );
    }

    const json = (await res.json()) as any[];
    if (!Array.isArray(json) || json.length === 0) {
      return NextResponse.json(
        { ok: false, error: "No results found for that location." },
        { status: 404 }
      );
    }

    const top = json[0];
    const lat = Number(top.lat);
    const lon = Number(top.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return NextResponse.json(
        { ok: false, error: "Geocoder returned invalid coordinates." },
        { status: 502 }
      );
    }

    const payload = {
      ok: true,
      source: "nominatim",
      lat,
      lon,
      display_name: String(top.display_name || q),
      raw: {
        place_id: top.place_id,
        osm_type: top.osm_type,
        osm_id: top.osm_id,
        type: top.type,
        class: top.class,
      },
    };

    setCache(cacheKey, payload);
    return NextResponse.json(payload);
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "unknown error" },
      { status: 400 }
    );
  }
}
