// web/src/lib/calendar/events.ts
import { fetchSunMoonLongitudesUTC, norm360 } from "./astro";
import { SYNODIC_MONTH } from "./lunar";
import { angleToSign, fmtSignPos, nextSignBoundary } from "./zodiac";

function msToDays(ms: number) {
  return ms / 86400_000;
}

// Format a UTC instant into local “M/D HH:MM am/pm” using America/New_York
export function fmtLocalShort(dtUTC: Date, timeZone: string) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return fmt.format(dtUTC);
}

export type LunationMarker = {
  kind: "New Moon" | "First Quarter" | "Full Moon" | "Last Quarter";
  whenLocal: string;
  degreeText: string; // e.g. "28° Sag 24'"
  isoUTC: string;
};

export async function computeMoonSignAndIngress(asOfUTC: Date, timeZone: string) {
  const { moonLon } = await fetchSunMoonLongitudesUTC(asOfUTC);
  const now = angleToSign(moonLon);
  const nextBoundary = nextSignBoundary(moonLon);

  const ingressUTC = await findNextMoonLongitudeCrossing(asOfUTC, nextBoundary);

  // what sign will it be entering?
  const entering = angleToSign(nextBoundary === 0 ? 0 : nextBoundary + 0.0001);

  return {
    moonSign: now.sign,
    moonPos: fmtSignPos(moonLon),
    entersSign: entering.sign,
    entersLocal: fmtLocalShort(ingressUTC, timeZone),
    entersUTC: ingressUTC.toISOString(),
  };
}

// ---- Lunation markers: last new moon + quarter points after it ----

export async function computeLunationMarkers(asOfUTC: Date, timeZone: string): Promise<LunationMarker[]> {
  const lastNewMoonUTC = await findMostRecentPhaseAngle(asOfUTC, 0);

  const firstQuarterUTC = await findNextPhaseAngle(lastNewMoonUTC, 90);
  const fullMoonUTC = await findNextPhaseAngle(lastNewMoonUTC, 180);
  const lastQuarterUTC = await findNextPhaseAngle(lastNewMoonUTC, 270);

  // Degree text: use Moon longitude at that moment
  async function marker(kind: LunationMarker["kind"], t: Date): Promise<LunationMarker> {
    const { moonLon } = await fetchSunMoonLongitudesUTC(t);
    const pos = angleToSign(moonLon);
    const degreeText = `${pos.deg}° ${pos.sign.slice(0, 3)} ${String(pos.min).padStart(2, "0")}'`;
    return {
      kind,
      whenLocal: fmtLocalShort(t, timeZone),
      degreeText,
      isoUTC: t.toISOString(),
    };
  }

  return [
    await marker("New Moon", lastNewMoonUTC),
    await marker("First Quarter", firstQuarterUTC),
    await marker("Full Moon", fullMoonUTC),
    await marker("Last Quarter", lastQuarterUTC),
  ];
}

// ---- Root finding helpers ----

// Moon longitude crossing a target boundary (0,30,60,...)
// search forward up to 3 days; step 30 minutes to bracket; then bisection
async function findNextMoonLongitudeCrossing(startUTC: Date, targetLon: number): Promise<Date> {
  const maxDays = 3;
  const stepMinutes = 30;

  const liftLon = (lon: number) => {
    // make monotonic around wrap: treat values below 30° as >360 when needed
    const x = norm360(lon);
    return x < 30 ? x + 360 : x;
  };

  const tgt = targetLon === 0 ? 360 : targetLon;

  let t0 = startUTC.getTime();
  let last = startUTC;
  let lastVal = (await moonLonLifted(last)) - tgt;

  const steps = Math.ceil((maxDays * 24 * 60) / stepMinutes);
  for (let i = 1; i <= steps; i++) {
    const cur = new Date(t0 + i * stepMinutes * 60_000);
    const curVal = (await moonLonLifted(cur)) - tgt;

    if (lastVal <= 0 && curVal >= 0) {
      return bisectUTC(last, cur, async (d) => (await moonLonLifted(d)) - tgt);
    }

    last = cur;
    lastVal = curVal;
  }

  // Fallback: return estimate if not found (should be rare)
  return new Date(t0 + 2 * 86400_000);

  async function moonLonLifted(d: Date) {
    const { moonLon } = await fetchSunMoonLongitudesUTC(d);
    return liftLon(moonLon);
  }
}

// Find next time phase angle reaches target (0/90/180/270) after a start instant
async function findNextPhaseAngle(startUTC: Date, targetDeg: number): Promise<Date> {
  const stepMinutes = 60;
  const maxDays = 12; // safe for a full lunation span

  const lift = (ang: number) => {
    // lift to avoid wrap at 0. For targets near 0, treat 0..30 as 360..390
    const a = norm360(ang);
    if (targetDeg === 0) return a < 30 ? a + 360 : a;
    return a;
  };

  const tgt = targetDeg === 0 ? 360 : targetDeg;

  let t0 = startUTC.getTime();
  let last = startUTC;
  let lastVal = (await phaseLifted(last)) - tgt;

  const steps = Math.ceil((maxDays * 24 * 60) / stepMinutes);
  for (let i = 1; i <= steps; i++) {
    const cur = new Date(t0 + i * stepMinutes * 60_000);
    const curVal = (await phaseLifted(cur)) - tgt;

    if (lastVal <= 0 && curVal >= 0) {
      return bisectUTC(last, cur, async (d) => (await phaseLifted(d)) - tgt);
    }

    last = cur;
    lastVal = curVal;
  }

  // Fallback
