// web/src/lib/calendar/equinox.ts
import { fetchSunMoonLongitudesUTC, norm360 } from "./astro";
import { formatYMDInTZ, TZ } from "./timezone";

// In-memory cache (per server instance)
const cache = new Map<number, { equinoxUTC: Date; equinoxLocalDay: string }>();

// Find the UTC instant when Sun longitude crosses 0° Aries near March equinox for a given Gregorian year.
// Uses bisection on a bracket where SunLon wraps through 360->0.
export async function getSpringEquinoxUTCAndLocalDay(year: number) {
  const cached = cache.get(year);
  if (cached) return cached;

  // Bracket around March 18–22 (UTC)
  const start = new Date(Date.UTC(year, 2, 18, 0, 0, 0));
  const end = new Date(Date.UTC(year, 2, 22, 0, 0, 0));

  // Evaluate wrapped distance to 0 Aries using lon in [0..360)
  async function sunLon(d: Date) {
    const { sunLon } = await fetchSunMoonLongitudesUTC(d);
    return norm360(sunLon);
  }

  const aLon = await sunLon(start);
  const bLon = await sunLon(end);

  // We want to find where longitude wraps: near 360 then 0.
  // Convert to a monotonic function by mapping values near end-of-Pisces to > 360.
  const lift = (lon: number) => (lon < 30 ? lon + 360 : lon); // Aries early -> >360, Pisces late -> ~330-360

  let a = start.getTime();
  let b = end.getTime();
  let fa = lift(aLon) - 360; // target is 360
  let fb = lift(bLon) - 360;

  // If bracket failed (rare), widen
  if (fa > 0 || fb < 0) {
    const start2 = new Date(Date.UTC(year, 2, 16, 0, 0, 0));
    const end2 = new Date(Date.UTC(year, 2, 24, 0, 0, 0));
    a = start2.getTime();
    b = end2.getTime();
    fa = (lift(await sunLon(new Date(a))) - 360);
    fb = (lift(await sunLon(new Date(b))) - 360);
  }

  // Bisection to ~30 seconds
  for (let i = 0; i < 40; i++) {
    const mid = (a + b) / 2;
    const mLon = lift(await sunLon(new Date(mid)));
    const fm = mLon - 360;

    if (Math.abs(b - a) < 30_000) {
      a = mid;
      break;
    }
    if (fa <= 0 && fm >= 0) {
      b = mid;
      fb = fm;
    } else {
      a = mid;
      fa = fm;
    }
  }

  const equinoxUTC = new Date(a);
  const equinoxLocalDay = formatYMDInTZ(equinoxUTC, TZ);

  const out = { equinoxUTC, equinoxLocalDay };
  cache.set(year, out);
  return out;
}
