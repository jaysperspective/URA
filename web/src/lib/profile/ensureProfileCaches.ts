// src/lib/profile/ensureProfileCaches.ts
import { prisma } from "@/lib/prisma";
import { Prisma, Profile } from "@prisma/client";
import { fetchChart } from "@/lib/astro/client";
import { withProfileLock } from "./profileLock";

type BirthPayloadUTC = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  latitude: number;
  longitude: number;
};

type SafeOk = { ok: true; data: any };
type SafeErr = { ok: false; error: string; status?: number; body?: string };
type SafeResult = SafeOk | SafeErr;

function getLocalDayKey(timezone: string, d = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);

  const y = parts.find((p) => p.type === "year")?.value;
  const m = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;

  if (!y || !m || !day) throw new Error("Could not compute local day key.");
  return `${y}-${m}-${day}`; // e.g. 2026-01-06
}

/**
 * Convert a "wall clock" local time in a timezone into a UTC Date.
 * This avoids treating local birth time as UTC.
 *
 * Approach: Use Intl.DateTimeFormat to get the timezone offset for that date/time,
 * then apply it to convert local -> UTC.
 */
function zonedLocalToUtcDate(opts: {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number;
  minute: number;
  timezone: string;
}) {
  const { year, month, day, hour, minute, timezone } = opts;

  // Create a date in UTC with the local time values (as a reference point)
  const referenceUtc = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));

  // Get what time it would be in the target timezone at this UTC moment
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(referenceUtc);
  const getPart = (type: string) => parts.find((p) => p.type === type)?.value || "0";

  const zonedYear = parseInt(getPart("year"), 10);
  const zonedMonth = parseInt(getPart("month"), 10);
  const zonedDay = parseInt(getPart("day"), 10);
  const zonedHour = parseInt(getPart("hour"), 10);
  const zonedMinute = parseInt(getPart("minute"), 10);

  // Calculate the offset: how much the timezone differs from UTC at this moment
  const zonedAsUtc = new Date(Date.UTC(zonedYear, zonedMonth - 1, zonedDay, zonedHour, zonedMinute, 0));
  const offsetMs = zonedAsUtc.getTime() - referenceUtc.getTime();

  // The user's local time needs to be shifted by the OPPOSITE of this offset to get UTC
  // If timezone is UTC-5, offset is -5 hours, so we ADD 5 hours to local time to get UTC
  const localAsUtc = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
  return new Date(localAsUtc.getTime() - offsetMs);
}

function getAppBaseUrl() {
  const base =
    process.env.APP_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    process.env.APP_URL ||
    "";

  if (base) return base.replace(/\/$/, "");
  return "http://127.0.0.1:3000";
}

async function fetchAstroNatalUTC(birthUTC: BirthPayloadUTC) {
  const response = await fetchChart(birthUTC);

  if (!response.ok) {
    throw new Error(response.error || "astro-service /chart failed");
  }

  return response;
}

/**
 * NOTE: Daily caches should NOT crash SSR if endpoints are down.
 * We return ok:false and keep old blobs.
 */
async function postJsonSafe(path: string, payload: unknown): Promise<SafeResult> {
  const base = getAppBaseUrl();

  try {
    const r = await fetch(`${base}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    if (!r.ok) {
      const text = await r.text().catch(() => "");
      return {
        ok: false,
        error: `${path} failed: ${r.status}`,
        status: r.status,
        body: text.slice(0, 300),
      };
    }

    const json = await r.json().catch(() => null);
    return { ok: true, data: json };
  } catch (err: any) {
    return { ok: false, error: err?.message || `${path} fetch error` };
  }
}

/**
 * Atomic profile cache update with transaction safety.
 * Prevents race conditions during concurrent updates.
 */
async function updateProfileCachesAtomic(
  userId: number,
  updates: {
    natalChartJson?: Prisma.InputJsonValue;
    natalUpdatedAt?: Date;
    ascYearJson?: Prisma.InputJsonValue;
    lunationJson?: Prisma.InputJsonValue;
    asOfDate?: Date;
    dailyUpdatedAt?: Date;
  }
): Promise<Profile> {
  return await prisma.$transaction(
    async (tx) => {
      // Perform the update atomically
      return await tx.profile.update({
        where: { userId },
        data: updates,
      });
    },
    {
      maxWait: 5000,
      timeout: 10000,
    }
  );
}

/**
 * Internal implementation of cache updates.
 */
async function ensureProfileCachesInternal(userId: number): Promise<Profile | null> {
  const profile = await prisma.profile.findUnique({ where: { userId } });
  if (!profile) return null;

  const tz = profile.timezone || "America/New_York";
  if (!profile.setupDone) return profile;

  const {
    birthYear,
    birthMonth,
    birthDay,
    birthHour,
    birthMinute,
    birthLat,
    birthLon,
  } = profile as unknown as {
    birthYear: number | null;
    birthMonth: number | null;
    birthDay: number | null;
    birthHour: number | null;
    birthMinute: number | null;
    birthLat: number | null;
    birthLon: number | null;
  };

  const hasBirth =
    typeof birthYear === "number" &&
    typeof birthMonth === "number" &&
    typeof birthDay === "number" &&
    typeof birthHour === "number" &&
    typeof birthMinute === "number" &&
    typeof birthLat === "number" &&
    typeof birthLon === "number";

  // If incomplete, don't compute.
  if (!hasBirth) return profile;

  /**
   * ✅ IMPORTANT FIX:
   * - astro-service wants UTC parts
   * - app routes (/api/asc-year, /api/lunation) want LOCAL birth parts + timezone
   */
  const birthUTC = zonedLocalToUtcDate({
    year: birthYear,
    month: birthMonth,
    day: birthDay,
    hour: birthHour,
    minute: birthMinute,
    timezone: tz,
  });

  const birthPayloadUTC: BirthPayloadUTC = {
    year: birthUTC.getUTCFullYear(),
    month: birthUTC.getUTCMonth() + 1,
    day: birthUTC.getUTCDate(),
    hour: birthUTC.getUTCHours(),
    minute: birthUTC.getUTCMinutes(),
    latitude: birthLat,
    longitude: birthLon,
  };

  const todayKey = getLocalDayKey(tz, new Date());
  const cachedKey = profile.asOfDate ? getLocalDayKey(tz, profile.asOfDate) : null;

  const needsDaily =
    !profile.ascYearJson ||
    !profile.lunationJson ||
    !profile.asOfDate ||
    cachedKey !== todayKey;

  const needsNatal = !profile.natalChartJson;

  // Prisma JSON typing: avoid passing plain null
  let natalChartJson: Prisma.InputJsonValue | undefined =
    (profile.natalChartJson ?? undefined) as unknown as Prisma.InputJsonValue | undefined;

  let ascYearJson: Prisma.InputJsonValue | undefined =
    (profile.ascYearJson ?? undefined) as unknown as Prisma.InputJsonValue | undefined;

  let lunationJson: Prisma.InputJsonValue | undefined =
    (profile.lunationJson ?? undefined) as unknown as Prisma.InputJsonValue | undefined;

  if (needsNatal) {
    natalChartJson = (await fetchAstroNatalUTC(birthPayloadUTC)) as unknown as Prisma.InputJsonValue;
  }

  let didDailyUpdate = false;

  if (needsDaily) {
    // ✅ Send LOCAL birth inputs to your app routes (they do their own tz→UTC)
    const payloadLocal = {
      year: birthYear,
      month: birthMonth,
      day: birthDay,
      hour: birthHour,
      minute: birthMinute,

      // core contract
      lat: birthLat,
      lon: birthLon,

      // compatibility
      latitude: birthLat,
      longitude: birthLon,

      timezone: tz,
      asOfDate: todayKey, // (optional) lets APIs compute stable "as-of" for that local day
    };

    const [ascRes, lunaRes] = await Promise.all([
      postJsonSafe("/api/asc-year", payloadLocal),
      postJsonSafe("/api/lunation", payloadLocal),
    ]);

    if (ascRes.ok) {
      ascYearJson = ascRes.data as unknown as Prisma.InputJsonValue;
      didDailyUpdate = true;
    } else {
      console.warn("[ensureProfileCaches] asc-year skipped:", ascRes);
    }

    if (lunaRes.ok) {
      lunationJson = lunaRes.data as unknown as Prisma.InputJsonValue;
      didDailyUpdate = true;
    } else {
      console.warn("[ensureProfileCaches] lunation skipped:", lunaRes);
    }
  }

  if (needsNatal || didDailyUpdate) {
    try {
      return await updateProfileCachesAtomic(userId, {
        natalChartJson: (natalChartJson ?? Prisma.DbNull) as unknown as Prisma.InputJsonValue,
        natalUpdatedAt: needsNatal ? new Date() : (profile.natalUpdatedAt ?? undefined),

        ascYearJson: (ascYearJson ?? Prisma.DbNull) as unknown as Prisma.InputJsonValue,
        lunationJson: (lunationJson ?? Prisma.DbNull) as unknown as Prisma.InputJsonValue,

        asOfDate: didDailyUpdate ? new Date() : (profile.asOfDate ?? undefined),
        dailyUpdatedAt: didDailyUpdate ? new Date() : (profile.dailyUpdatedAt ?? undefined),
      });
    } catch (err) {
      // On conflict, re-fetch the profile (another request may have updated it)
      console.warn("[ensureProfileCaches] Transaction conflict, re-fetching:", err);
      return await prisma.profile.findUnique({ where: { userId } });
    }
  }

  return profile;
}

/**
 * Ensures the user's cached natal + daily outputs exist and are current.
 * - Natal: computed once (until birth data changes; edit should rebuild)
 * - Daily: recomputed once per local day (timezone-aware)
 * - Uses a lock to prevent concurrent updates for the same user
 */
export async function ensureProfileCaches(userId: number): Promise<Profile | null> {
  return withProfileLock(userId, () => ensureProfileCachesInternal(userId));
}
