// web/src/lib/calendar/calendar.ts
import { TZ, formatYMDInTZ, utcMsForLocalMidnight } from "./timezone";
import { computeSolarForLocalDay } from "./solar";
import { computeLunarOverlay } from "./lunar";
import { computeMoonSignAndIngress, computeLunationMarkers, fmtLocalShort } from "./events";
import { fetchSunMoonLongitudesUTC } from "./astro";
import { fmtSignPos } from "./zodiac";

export { TZ };

export async function getCalendarForYMD(ymd: string | null) {
  const tz = TZ;

  const targetYMD = ymd ? ymd : formatYMDInTZ(new Date(), tz);

  // Stable per-civil-day calculations use local noon
  const noonUTCms = utcMsForLocalMidnight(targetYMD, tz) + 12 * 3600_000;
  const noonUTC = new Date(noonUTCms);

  // For "As of" display, use real-time now when ymd is null; otherwise show noon of that day
  const asOfUTC = ymd ? noonUTC : new Date();
  const asOfLocal = fmtLocalShort(asOfUTC, tz);

  // Launch instant for LC epoch: local midnight + 12h (stable)
  const launchYMD = process.env.URA_LAUNCH_YMD || targetYMD;
  const launchNoonUTC = new Date(utcMsForLocalMidnight(launchYMD, tz) + 12 * 3600_000);

  const solar = await computeSolarForLocalDay(targetYMD);

  // Lunar overlay computed at noon of the selected day (stable while scrolling days)
  const lunar = await computeLunarOverlay(noonUTC, launchNoonUTC);

  // Moon sign + ingress computed at "as of" instant (feels live)
  const moonSign = await computeMoonSignAndIngress(asOfUTC, tz);

  // Sun position (for list row)
  const { sunLon } = await fetchSunMoonLongitudesUTC(asOfUTC);
  const sunPos = fmtSignPos(sunLon);

  // Lunation markers for current cycle (New/Q1/Full/Q3)
  const markers = await computeLunationMarkers(asOfUTC, tz);

  return {
    ok: true,
    tz,
    gregorian: {
      ymd: targetYMD,
      asOfLocal,
    },
    solar,
    lunar,
    astro: {
      sunPos,
      moonPos: moonSign.moonPos,
      moonSign: moonSign.moonSign,
      moonEntersSign: moonSign.entersSign,
      moonEntersLocal: moonSign.entersLocal,
    },
    lunation: {
      markers,
    },
    anchors: solar.anchors,
  };
}
