// src/lib/astro/ingressCache.ts
// Shared globalThis-backed TTL cache for Aries ingress dates.
// Both collectiveData.ts and calendar/route.ts read/write to the same cache,
// so visiting the Sun page warms the cache for the Moon page and vice versa.

const TTL_30_DAYS = 30 * 24 * 60 * 60 * 1000;

type CacheEntry = { exp: number; value: string };

// ---------------------------------------------------------------------------
// Shared globalThis-backed cache (survives HMR, shared across modules)
// Same pattern as web/src/app/api/geocode/route.ts
// ---------------------------------------------------------------------------
const INGRESS_CACHE: Map<string, CacheEntry> =
  (globalThis as any).__URA_INGRESS_CACHE__ ?? new Map<string, CacheEntry>();
(globalThis as any).__URA_INGRESS_CACHE__ = INGRESS_CACHE;

export function getIngress(key: string): string | null {
  const hit = INGRESS_CACHE.get(key);
  if (!hit) return null;
  if (Date.now() > hit.exp) {
    INGRESS_CACHE.delete(key);
    return null;
  }
  return hit.value;
}

export function setIngress(key: string, isoValue: string, ttlMs: number = TTL_30_DAYS) {
  INGRESS_CACHE.set(key, { value: isoValue, exp: Date.now() + ttlMs });
}

// ---------------------------------------------------------------------------
// Pre-warm helpers (self-contained; only need sun longitude from astro-service)
// ---------------------------------------------------------------------------

function getAstroServiceChartUrl() {
  const raw = process.env.ASTRO_SERVICE_URL || "http://127.0.0.1:3002";
  const base = raw.replace(/\/+$/, "").replace(/\/chart$/, "");
  return `${base}/chart`;
}

function normalize360(deg: number) {
  const v = deg % 360;
  return v < 0 ? v + 360 : v;
}

function signedDiffDeg(a: number, target: number) {
  return ((a - target + 540) % 360) - 180;
}

// Lightweight chart cache used only during warm-up
const warmChartCache = new Map<string, { sunLon: number }>();

async function warmChartAtUTC(
  d: Date,
  latitude: number,
  longitude: number,
): Promise<{ sunLon: number }> {
  const key = `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}T${d.getUTCHours()}:${d.getUTCMinutes()}|${latitude}|${longitude}`;
  const cached = warmChartCache.get(key);
  if (cached) return cached;

  const chartUrl = getAstroServiceChartUrl();
  const r = await fetch(chartUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      year: d.getUTCFullYear(),
      month: d.getUTCMonth() + 1,
      day: d.getUTCDate(),
      hour: d.getUTCHours(),
      minute: d.getUTCMinutes(),
      latitude,
      longitude,
    }),
  });

  if (!r.ok) throw new Error(`astro-service error (${r.status})`);
  const json = await r.json();
  const sunLon = json?.data?.planets?.sun?.lon;
  if (typeof sunLon !== "number") throw new Error("missing sun lon");

  const out = { sunLon };
  warmChartCache.set(key, out);
  return out;
}

async function warmFindAriesIngress(
  year: number,
  latitude: number,
  longitude: number,
): Promise<Date> {
  const la = Math.round(latitude * 10) / 10;
  const lo = Math.round(longitude * 10) / 10;
  const cacheKey = `ariesIngress:${year}|${la}|${lo}`;

  const cachedISO = getIngress(cacheKey);
  if (cachedISO) return new Date(cachedISO);

  const start = new Date(Date.UTC(year, 2, 18, 0, 0, 0));
  const end = new Date(Date.UTC(year, 2, 23, 0, 0, 0));

  const startChart = await warmChartAtUTC(start, latitude, longitude);
  let prevT = start;
  let prevDiff = signedDiffDeg(startChart.sunLon, 0);

  const totalHours = Math.floor((end.getTime() - start.getTime()) / 3600_000);
  for (let i = 1; i <= totalHours; i++) {
    const t = new Date(start.getTime() + i * 3600_000);
    const cur = await warmChartAtUTC(t, latitude, longitude);
    const curDiff = signedDiffDeg(cur.sunLon, 0);

    if (
      prevDiff === 0 ||
      curDiff === 0 ||
      (prevDiff < 0 && curDiff > 0) ||
      (prevDiff > 0 && curDiff < 0)
    ) {
      let loMs = prevT.getTime();
      let hiMs = t.getTime();

      for (let k = 0; k < 20; k++) {
        const mid = Math.floor((loMs + hiMs) / 2);
        const midChart = await warmChartAtUTC(new Date(mid), latitude, longitude);
        const midDiff = signedDiffDeg(midChart.sunLon, 0);

        if ((prevDiff <= 0 && midDiff <= 0) || (prevDiff >= 0 && midDiff >= 0)) {
          loMs = mid;
          prevDiff = midDiff;
        } else {
          hiMs = mid;
        }
      }

      const out = new Date(hiMs);
      setIngress(cacheKey, out.toISOString());
      return out;
    }

    prevT = t;
    prevDiff = curDiff;
  }

  const fallback = new Date(Date.UTC(year, 2, 20, 12, 0, 0));
  setIngress(cacheKey, fallback.toISOString());
  return fallback;
}

// ---------------------------------------------------------------------------
// Auto-warm on module load (non-blocking)
// Pre-computes current, previous, and next year ingress for lat=0/lon=0
// (the collective 0° Aries anchor used by both Sun and Moon pages)
// ---------------------------------------------------------------------------
function warmIngressCache() {
  const year = new Date().getUTCFullYear();
  const lat = 0;
  const lon = 0;

  Promise.all([
    warmFindAriesIngress(year, lat, lon),
    warmFindAriesIngress(year - 1, lat, lon),
    warmFindAriesIngress(year + 1, lat, lon),
  ])
    .then(() => {
      console.log(`[ingressCache] Pre-warmed ingress for years ${year - 1}, ${year}, ${year + 1}`);
    })
    .catch((err) => {
      console.warn("[ingressCache] Pre-warm failed (astro-service may not be ready):", err?.message);
    });
}

setTimeout(warmIngressCache, 0);
