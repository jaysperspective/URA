// web/src/lib/calendar/calendar.ts
import { TZ, formatYMDInTZ } from "./timezone";
import { computeSolarForLocalDay } from "./solar";
import { computeLunarOverlay } from "./lunar";
import { utcMsForLocalMidnight } from "./timezone";

export { TZ };

export async function getCalendarForYMD(ymd: string | null) {
  const tz = TZ;

  // Determine target local day
  let targetYMD: string;
  if (ymd) {
    targetYMD = ymd;
  } else {
    targetYMD = formatYMDInTZ(new Date(), tz);
  }

  // For lunar overlay, we compute at local noon (stable within the civil day)
  const noonUTCms = utcMsForLocalMidnight(targetYMD, tz) + 12 * 3600_000;
  const noonUTC = new Date(noonUTCms);

  const solar = await computeSolarForLocalDay(targetYMD);
  const lunar = await computeLunarOverlay(noonUTC);

  return {
    ok: true,
    tz,
    gregorian: { ymd: targetYMD },
    solar,
    lunar,
    anchors: solar.anchors,
  };
}
