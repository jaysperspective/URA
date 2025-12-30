// web/src/lib/calendar/lunar.ts
import { fetchSunMoonLongitudesUTC, norm360 } from "./astro";
import { getFirstNewMoonAfterLaunchUTC } from "./newmoon";

export const SYNODIC_MONTH = 29.530588853; // mean synodic month (days)

function msToDays(ms: number) {
  return ms / 86400_000;
}

export async function computeLunarOverlay(dtUTC: Date, launchUTC: Date) {
  const { sunLon, moonLon } = await fetchSunMoonLongitudesUTC(dtUTC);

  const phaseAngleDeg = norm360(moonLon - sunLon); // 0=new, 180=full
  const lunarAgeDays = (SYNODIC_MONTH * phaseAngleDeg) / 360;
  const lunarDay = Math.floor(lunarAgeDays + 1e-9);

  const phaseName = lunarPhaseNameFromAngle(phaseAngleDeg);

  // ✅ LC numbering anchored to launch:
  const firstNewMoon = await getFirstNewMoonAfterLaunchUTC(launchUTC);

  let cycleNumber: number;
  if (dtUTC < firstNewMoon) {
    cycleNumber = 0; // until first new moon after launch
  } else {
    cycleNumber = 1 + Math.floor(msToDays(dtUTC.getTime() - firstNewMoon.getTime()) / SYNODIC_MONTH);
  }

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
