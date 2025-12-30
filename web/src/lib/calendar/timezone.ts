// web/src/lib/calendar/timezone.ts
export const TZ = "America/New_York";

// Extract YYYY-MM-DD in a given timezone for a Date instant
export function formatYMDInTZ(d: Date, timeZone = TZ): string {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(d); // "YYYY-MM-DD"
}

// Parse offset like "GMT-5" or "GMT-04:00"
function parseGMTOffsetToMinutes(tzName: string): number {
  // tzName: "GMT-5", "GMT-04:00"
  const m = tzName.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
  if (!m) return 0;
  const sign = m[1] === "-" ? -1 : 1;
  const hh = Number(m[2]);
  const mm = m[3] ? Number(m[3]) : 0;
  return sign * (hh * 60 + mm);
}

// Get offset minutes for a UTC instant in a timezone
export function getOffsetMinutesForInstant(d: Date, timeZone = TZ): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "shortOffset",
  }).formatToParts(d);

  const tzPart = parts.find((p) => p.type === "timeZoneName")?.value || "GMT+0";
  return parseGMTOffsetToMinutes(tzPart);
}

// Convert a local civil date (YYYY-MM-DD) at local 00:00 to UTC ms.
// Iterative to handle DST transitions.
export function utcMsForLocalMidnight(ymd: string, timeZone = TZ): number {
  const [y, m, d] = ymd.split("-").map(Number);

  // Initial guess: UTC midnight same date
  let guess = Date.UTC(y, m - 1, d, 0, 0, 0);

  for (let i = 0; i < 3; i++) {
    const off = getOffsetMinutesForInstant(new Date(guess), timeZone);
    const candidate = Date.UTC(y, m - 1, d, 0, 0, 0) - off * 60_000;
    if (Math.abs(candidate - guess) < 1000) {
      guess = candidate;
      break;
    }
    guess = candidate;
  }
  return guess;
}

// Add N days to a local civil date (YYYY-MM-DD) in timezone, returning YYYY-MM-DD.
// Works by using UTC ms for local midnight and stepping by 86400000ms.
export function addDaysLocal(ymd: string, days: number, timeZone = TZ): string {
  const ms = utcMsForLocalMidnight(ymd, timeZone);
  const next = new Date(ms + days * 86400_000);
  return formatYMDInTZ(next, timeZone);
}

// Whole-day difference between two local civil dates: ymd2 - ymd1
export function diffDaysLocal(ymd1: string, ymd2: string, timeZone = TZ): number {
  const a = utcMsForLocalMidnight(ymd1, timeZone);
  const b = utcMsForLocalMidnight(ymd2, timeZone);
  return Math.round((b - a) / 86400_000);
}
