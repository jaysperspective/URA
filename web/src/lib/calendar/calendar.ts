// web/src/lib/calendar/calendar.ts
import { TZ, formatYMDInTZ, utcMsForLocalMidnight } from "./timezone";
import { computeSolarForLocalDay } from "./solar";
import { computeLunarOverlay } from "./lunar";

export { TZ };

export async function getCalendarForYMD(ymd: string | null) {
  const tz = TZ;

  const targetYMD = ymd ? ymd : formatYMDInTZ(new Date(), tz);

  // Compute lunar overlay at local noon for the target civil day (stable within the day)
  const noonUTCms = utcMsForLocalMidnight(targetYMD, tz) + 12 * 3600_000;
  const noonUTC = new Date(noonUTCms);

  // Launch instant for LC epoch: URA_LAUNCH_YMD at local midnight + 12h
  const launchYMD = process.env.URA_LAUNCH_YMD || targetYMD;
  const launchNoonUTC = new Date(utcMsForLocalMidnight(launchYMD, tz) + 12 * 3600_000);

  const solar = await computeSolarForLocalDay(targetYMD);
  const lunar = await computeLunarOverlay(noonUTC, launchNoonUTC);

  return {
    ok: true,
    tz,
    gregorian: { ymd: targetYMD },
    solar,
    lunar,
    anchors: solar.anchors,
  };
}
