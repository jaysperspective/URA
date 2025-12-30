// web/src/lib/calendar/solar.ts
import { getSpringEquinoxUTCAndLocalDay } from "./equinox";
import { diffDaysLocal, TZ } from "./timezone";

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
  const launchEquinoxYear = Number(process.env.URA_LAUNCH_EQUINOX_YEAR);
  if (!launchEquinoxYear || Number.isNaN(launchEquinoxYear)) {
    throw new Error("Missing URA_LAUNCH_EQUINOX_YEAR (e.g. 2026)");
  }

  // E(launchEquinoxYear) is the first Aries-ingress day AFTER launch (this starts Year 1)
  const E1 = await getSpringEquinoxUTCAndLocalDay(launchEquinoxYear);

  // If target is before E1 day, we are in Year 0 — but we still compute phase/day
  // using the previous equinox anchor (E0 = equinox day of the prior year).
  if (targetLocalYMD < E1.equinoxLocalDay) {
    const E0 = await getSpringEquinoxUTCAndLocalDay(launchEquinoxYear - 1);
    const anchors = {
      equinoxLocalDay: E0.equinoxLocalDay,
      nextEquinoxLocalDay: E1.equinoxLocalDay,
    };

    const interTotal = 5; // keep Year 0 simple + consistent
    const yearLength = 360 + interTotal;

    const d = diffDaysLocal(anchors.equinoxLocalDay, targetLocalYMD, TZ);
    return mapDayIndexToSolar(0, d, yearLength, anchors);
  }

  // For Year 1+, determine which equinox anchor this date belongs to by bracketing.
  const [gy] = targetLocalYMD.split("-").map(Number);
  const Eprev = await getSpringEquinoxUTCAndLocalDay(gy - 1);
  const Ethis = await getSpringEquinoxUTCAndLocalDay(gy);
  const Enext = await getSpringEquinoxUTCAndLocalDay(gy + 1);

  // Anchor selection for civil day logic
  let anchor = Ethis;
  let next = Enext;
  let anchorGregYear = gy;

  if (targetLocalYMD < Ethis.equinoxLocalDay) {
    anchor = Eprev;
    next = Ethis;
    anchorGregYear = gy - 1;
  }

  // Map equinox-year to URA year number:
  // Year 1 starts at E(launchEquinoxYear)
  const yearNum = anchorGregYear - launchEquinoxYear + 1;

  const interTotal = isLeapInterphaseYear(yearNum) ? 6 : 5;
  const yearLength = 360 + interTotal;

  const anchors = {
    equinoxLocalDay: anchor.equinoxLocalDay,
    nextEquinoxLocalDay: next.equinoxLocalDay,
  };

  const d = diffDaysLocal(anchors.equinoxLocalDay, targetLocalYMD, TZ);
  return mapDayIndexToSolar(yearNum, d, yearLength, anchors);
}

function mapDayIndexToSolar(
  yearNum: number,
  dayIndexInYear: number,
  yearLength: number,
  anchors: { equinoxLocalDay: string; nextEquinoxLocalDay: string }
): SolarOut {
  const interTotal = yearLength - 360;

  // Normalize to safe bounds
  if (dayIndexInYear < 0) dayIndexInYear = 0;
  if (dayIndexInYear >= yearLength) dayIndexInYear = yearLength - 1;

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

  const interphaseDay = dayIndexInYear - 360 + 1;
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
