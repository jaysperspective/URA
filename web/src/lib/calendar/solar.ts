// web/src/lib/calendar/solar.ts
import { getSpringEquinoxUTCAndLocalDay } from "./equinox";
import { addDaysLocal, diffDaysLocal, formatYMDInTZ, TZ } from "./timezone";

export type SolarOut = {
  year: number;
  kind: "PHASE" | "INTERPHASE";
  phase?: number;
  dayInPhase?: number;
  interphaseDay?: number;
  interphaseTotal?: number;
  label: string;
  dayIndexInYear: number;
  yearLength: number;
  anchors: {
    equinoxLocalDay: string;
    nextEquinoxLocalDay: string;
  };
};

export function isLeapInterphaseYear(y: number) {
  // v1 simple: every 4th year
  return y % 4 === 0;
}

export async function computeSolarForLocalDay(targetLocalYMD: string): Promise<SolarOut> {
  // Determine which URA solar year this date falls in:
  // Find the equinox day for the local Gregorian year and the adjacent ones.
  const [gy] = targetLocalYMD.split("-").map(Number);

  // We need E for gy-1, gy, gy+1 to bracket.
  const Eprev = await getSpringEquinoxUTCAndLocalDay(gy - 1);
  const Ethis = await getSpringEquinoxUTCAndLocalDay(gy);
  const Enext = await getSpringEquinoxUTCAndLocalDay(gy + 1);

  // Year numbering:
  // - Year 1 begins at the first equinox AFTER launch (you will define “launch year” in UI or env later)
  // For now we map: URA year number = (equinoxGregorianYear - launchEquinoxYear + 1)
  // We'll implement launch as env var LAUNCH_EQUINOX_YEAR.
  const launchEquinoxYear = Number(process.env.URA_LAUNCH_EQUINOX_YEAR || gy); // fallback
  const mapYearNum = (equinoxGregorianYear: number) => equinoxGregorianYear - launchEquinoxYear + 1;

  // Determine which equinox day is the current year's anchor:
  // If target is before Ethis, use Eprev; else use Ethis. Next is the subsequent one.
  let anchor = Ethis;
  let next = Enext;
  let anchorGregYear = gy;

  if (targetLocalYMD < Ethis.equinoxLocalDay) {
    anchor = Eprev;
    next = Ethis;
    anchorGregYear = gy - 1;
  }

  const yearNum = mapYearNum(anchorGregYear);

  // Handle Year 0: dates before E(launchEquinoxYear)
  const launchAnchor = await getSpringEquinoxUTCAndLocalDay(launchEquinoxYear);
  if (targetLocalYMD < launchAnchor.equinoxLocalDay) {
    // Year 0 uses the same structure but year label is 0, anchored to launch day via env URA_LAUNCH_YMD
    const launchYMD = process.env.URA_LAUNCH_YMD || targetLocalYMD;
    const d0 = diffDaysLocal(launchYMD, targetLocalYMD, TZ);

    // We don’t force P1 start in Y0. We just compute a rolling coordinate from launch.
    const yearLength = 365 + (isLeapInterphaseYear(0) ? 1 : 0);
    const dayIndexInYear = Math.max(0, d0);

    // Map to Phase/Interphase within a 360+5(6) frame
    return mapDayIndexToSolar(0, dayIndexInYear, yearLength, {
      equinoxLocalDay: launchYMD,
      nextEquinoxLocalDay: launchAnchor.equinoxLocalDay,
    });
  }

  const interTotal = isLeapInterphaseYear(yearNum) ? 6 : 5;
  const yearLength = 360 + interTotal; // 365/366

  const equinoxLocalDay = anchor.equinoxLocalDay;
  const nextEquinoxLocalDay = next.equinoxLocalDay;

  const d = diffDaysLocal(equinoxLocalDay, targetLocalYMD, TZ); // 0-based
  const dayIndexInYear = d;

  return mapDayIndexToSolar(yearNum, dayIndexInYear, yearLength, {
    equinoxLocalDay,
    nextEquinoxLocalDay,
  });
}

function mapDayIndexToSolar(
  yearNum: number,
  dayIndexInYear: number,
  yearLength: number,
  anchors: { equinoxLocalDay: string; nextEquinoxLocalDay: string }
): SolarOut {
  const interTotal = yearLength - 360;

  if (dayIndexInYear < 0) {
    // Clamp for safety
    dayIndexInYear = 0;
  }

  if (dayIndexInYear < 360) {
    const phase = Math.floor(dayIndexInYear / 45) + 1; // 1..8
    const dayInPhase = (dayIndexInYear % 45) + 1; // 1..45
    return {
      year: yearNum,
      kind: "PHASE",
      phase,
      dayInPhase,
      label: `Y${yearNum}-P${phase}-${String(dayInPhase).padStart(2, "0")}`,
      dayIndexInYear,
      yearLength,
      anchors,
    };
  }

  const interphaseDay = dayIndexInYear - 360 + 1; // 1..(5/6)
  return {
    year: yearNum,
    kind: "INTERPHASE",
    interphaseDay,
    interphaseTotal: interTotal,
    label: `Y${yearNum}-INTER-${interphaseDay}`,
    dayIndexInYear,
    yearLength,
    anchors,
  };
}
