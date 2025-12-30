// web/src/lib/calendar/lunar.ts
import { fetchSunMoonLongitudesUTC, norm360 } from "./astro";

export const SYNODIC_MONTH = 29.530588853; // mean synodic month (days)

// Choose an epoch new moon JD-ish reference by using a fixed UTC date.
// (This is a stable anchor to produce LC numbers. It does not need to be “perfect”; it needs to be consistent.)
const EPOCH_UTC = new Date(Date.UTC(2000, 0, 6, 18, 14, 0)); // near a known new moon epoch often used in algorithms

function msToDays(ms: number) {
  return ms / 86400_000;
}

export async function computeLunarOverlay(dtUTC: Date) {
  const { sunLon, moonLon } = await fetchSunMoonLongitudesUTC(dtUTC);

  const phaseAngleDeg = norm360(moonLon - sunLon); // 0=new, 180=full
  const lunarAgeDays = (SYNODIC_MONTH * phaseAngleDeg) / 360;

  const lunarDay = Math.floor(lunarAgeDays + 1e-9); // integer day index

  const phaseName = lunarPhaseNameFromAngle(phaseAngleDeg);

  // Lunar cycle count: based on epoch + mean synodic month
  const cycles = Math.floor(msToDays(dtUTC.getTime() - EPOCH_UTC.getTime()) / SYNODIC_MONTH);
  const cycleNumber = 1 + cycles; // LC-1 at epoch window

  return {
    synodicMonthDays: SYNODIC_MONTH,
    phaseAngleDeg,
    lunarAgeDays,
    lunarDay,
    phaseName,
    cycleNumber,
    label: `LC-${cycleNumber} • LD-${lunarDay} (${phaseName})`,
  };
}

function lunarPhaseNameFromAngle(angle: number): string {
  // angle: 0..360; New=0, First Quarter=90, Full=180, Last Quarter=270
  // Use broad, stable bins (matches your “New / Crescent / Quarter / Gibbous / Full” structure)
  const a = angle;

  if (a < 1 || a >= 359) return "New";
  if (a < 90) return "Waxing Crescent";
  if (a >= 90 && a < 91) return "First Quarter";
  if (a < 180) return "Waxing Gibbous";
  if (a >= 179 && a <= 181) return "Full";
  if (a < 270) return "Waning Gibbous";
  if (a >= 270 && a < 271) return "Last Quarter";
  return "Waning Crescent";
}
