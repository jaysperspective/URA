// web/src/lib/calendar/solar-events.ts
import { fetchSunMoonLongitudesUTC, norm360 } from "./astro";
import { fmtLocalShort } from "./events";

function nextPhaseBoundary45(sunLon: number) {
  const x = norm360(sunLon);
  const next = (Math.floor(x / 45) + 1) * 45;
  return next >= 360 ? 0 : next;
}

function liftLon(lon: number) {
  const x = norm360(lon);
  return x < 45 ? x + 360 : x;
}

// Find next time the Sun crosses the next 45° boundary (within ~7 days)
export async function computeNextSolarPhaseIngress(asOfUTC: Date, timeZone: string) {
  const { sunLon } = await fetchSunMoonLongitudesUTC(asOfUTC);

  const boundary = nextPhaseBoundary45(sunLon);
  const tgt = boundary === 0 ? 360 : boundary;

  // bracket scan forward
  const stepMinutes = 60;
  const maxDays = 14;

  let t0 = asOfUTC.getTime();
  let left = asOfUTC;
  let fL = (await sunLonLifted(left)) - tgt;

  const steps = Math.ceil((maxDays * 24 * 60) / stepMinutes);
  for (let i = 1; i <= steps; i++) {
    const right = new Date(t0 + i * stepMinutes * 60_000);
    const fR = (await sunLonLifted(right)) - tgt;

    if (fL <= 0 && fR >= 0) {
      const hit = await bisectUTC(left, right, async (d) => (await sunLonLifted(d)) - tgt);
      return {
        nextBoundaryDeg: boundary,
        nextPhaseAtUTC: hit.toISOString(),
        nextPhaseAtLocal: fmtLocalShort(hit, timeZone),
      };
    }

    left = right;
    fL = fR;
  }

  // fallback: none found (shouldn’t happen)
  return {
    nextBoundaryDeg: boundary,
    nextPhaseAtUTC: asOfUTC.toISOString(),
    nextPhaseAtLocal: fmtLocalShort(asOfUTC, timeZone),
  };

  async function sunLonLifted(d: Date) {
    const { sunLon } = await fetchSunMoonLongitudesUTC(d);
    return liftLon(sunLon);
  }
}

async function bisectUTC(
  left: Date,
  right: Date,
  f: (d: Date) => Promise<number>
): Promise<Date> {
  let a = left.getTime();
  let b = right.getTime();
  let fa = await f(new Date(a));

  for (let i = 0; i < 40; i++) {
    const mid = (a + b) / 2;
    const fm = await f(new Date(mid));

    if (Math.abs(b - a) < 30_000) return new Date(mid);

    if (fa <= 0 && fm >= 0) {
      b = mid;
    } else {
      a = mid;
      fa = fm;
    }
  }

  return new Date((a + b) / 2);
}
