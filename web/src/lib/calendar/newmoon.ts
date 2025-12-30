// web/src/lib/calendar/newmoon.ts
import { fetchSunMoonLongitudesUTC, norm360 } from "./astro";
import { SYNODIC_MONTH } from "./lunar";

// cache next-new-moon after launch (per server instance)
let cachedFirstNewMoonAfterLaunchUTC: Date | null = null;

async function phaseAngleDeg(dt: Date) {
  const { sunLon, moonLon } = await fetchSunMoonLongitudesUTC(dt);
  return norm360(moonLon - sunLon); // 0=new, 180=full
}

// Find the next new moon after a given UTC time.
// We estimate time-to-next using current phase angle, then bisection refine.
export async function getFirstNewMoonAfterLaunchUTC(launchUTC: Date) {
  if (cachedFirstNewMoonAfterLaunchUTC) return cachedFirstNewMoonAfterLaunchUTC;

  const a0 = await phaseAngleDeg(launchUTC);
  const daysToNext = ((360 - a0) / 360) * SYNODIC_MONTH;
  const est = new Date(launchUTC.getTime() + daysToNext * 86400_000);

  // bracket ±2 days around estimate
  let left = new Date(est.getTime() - 2 * 86400_000);
  let right = new Date(est.getTime() + 2 * 86400_000);

  // lift angle so near-new-moon angles (0..30) become 360..390 for monotonic crossing
  const lift = (ang: number) => (ang < 30 ? ang + 360 : ang);

  let fL = lift(await phaseAngleDeg(left)) - 360;
  let fR = lift(await phaseAngleDeg(right)) - 360;

  // bisection to ~30 seconds
  for (let i = 0; i < 40; i++) {
    const midMs = (left.getTime() + right.getTime()) / 2;
    const mid = new Date(midMs);
    const fM = lift(await phaseAngleDeg(mid)) - 360;

    if (Math.abs(right.getTime() - left.getTime()) < 30_000) {
      cachedFirstNewMoonAfterLaunchUTC = mid;
      return mid;
    }

    if (fL <= 0 && fM >= 0) {
      right = mid;
      fR = fM;
    } else {
      left = mid;
      fL = fM;
    }
  }

  cachedFirstNewMoonAfterLaunchUTC = left;
  return left;
}
