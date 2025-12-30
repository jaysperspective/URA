// web/src/lib/calendar/lunar.ts
import { fetchSunMoonLongitudesUTC, norm360 } from "./astro";
import { getFirstNewMoonAfterLaunchUTC } from "./newmoon";

export const SYNODIC_MONTH = 29.530588853; // mean synodic month (days)

function msToDays(ms: number) {
  return ms / 86400_000;
}

export async function computeLunarOverlay(dtUTC: Date, launchUTC: Date) {
  const { sunLon, moonLon } = await fetchSunMoonLongitudesUTC(dtUTC);

  // 0° = New, 180° = Full
  const phaseAngleDeg = norm360(moonLon - sunLon);

  // Lunar "age" in days (0..29.53)
  const lunarAgeDays = (SYNODIC_MONTH * phaseAngleDeg) / 360;

  // Civil label day index (0..29). This is what your UI uses as LD-##
  const lunarDay = Math.floor(lunarAgeDays + 1e-9);

  // ✅ Use age-based rules so New/Full show up reliably on civil days
  const phaseName = lunarPhaseNameFromAge(lunarAgeDays);

  // LC numbering anchored to launch: LC-0 until first New Moon after launch
  const firstNewMoon = await getFirstNewMoonAfterLaunchUTC(launchUTC);

  let cycleNumber: number;
  if (dtUTC < firstNewMoon) {
    cycleNumber = 0;
  } else {
    cycleNumber =
      1 + Math.floor(msToDays(dtUTC.getTime() - firstNewMoon.getTime()) / SYNODIC_MONTH);
  }

  // Display formatting: keep your preferred “(Full)” / “(New)” style
  const displayPhase =
    phaseName === "New Moon" ? "New" :
    phaseName === "Full Moon" ? "Full" :
    phaseName;

  return {
    synodicMonthDays: SYNODIC_MONTH,
    phaseAngleDeg,
    lunarAgeDays,
    lunarDay,
    phaseName: displayPhase,
    cycleNumber,
    label: `LC-${cycleNumber} • LD-${lunarDay} (${displayPhase})`,
  };
}

/**
 * Age-based bins (civil-friendly)
 * - New Moon centered at age ~0
 * - Full Moon centered at age ~SYNODIC_MONTH/2 (~14.765)
 * These windows are intentionally wider so the label appears on the expected day.
 */
function lunarPhaseNameFromAge(ageDays: number): string {
  const full = SYNODIC_MONTH / 2; // ~14.765
  const q1 = SYNODIC_MONTH / 4;   // ~7.383
  const q3 = (3 * SYNODIC_MONTH) / 4; // ~22.148

  // Windows (in days). Tuned for civil-day labeling.
  const NEW_WINDOW = 1.0;     // +/- 1 day around New
  const FULL_WINDOW = 1.0;    // +/- 1 day around Full
  const QUARTER_WINDOW = 0.75;

  // New Moon: near 0 or near end of cycle
  if (ageDays <= NEW_WINDOW || ageDays >= SYNODIC_MONTH - NEW_WINDOW) return "New Moon";

  // Full Moon
  if (Math.abs(ageDays - full) <= FULL_WINDOW) return "Full Moon";

  // First / Last Quarter
  if (Math.abs(ageDays - q1) <= QUARTER_WINDOW) return "First Quarter";
  if (Math.abs(ageDays - q3) <= QUARTER_WINDOW) return "Last Quarter";

  // Crescents / Gibbous
  if (ageDays < q1) return "Waxing Crescent";
  if (ageDays < full) return "Waxing Gibbous";
  if (ageDays < q3) return "Waning Gibbous";
  return "Waning Crescent";
}

