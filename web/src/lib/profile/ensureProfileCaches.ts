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
  return `${y}-${m}-${day}`;
}

/**
 * Convert local wall-clock birth time in a timezone into a UTC Date.
 * (Avoid treating local birth time as UTC.)
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

  // Local -> UTC: subtract the offsetMs
  const localAsUtc = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
  return new Date(localAsUtc.getTime() - offsetMs);
}

/**
 * IMPORTANT: for server-side internal calls, do NOT rely on `localhost`
 * (can resolve to ::1 and cause intermittent fetch failures).
 */
function getAppBaseUrl() {
  const base =
    process.env.APP_BASE_URL ||
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    "";

  if (base) return base.replace(/\/$/, "");

  const port = process.env.PORT || "3000";
  return `http://127.0.0.1:${port}`;
}

async function fetchAstroNatalUTC(birthUTC: BirthPayloadUTC) {
  const response = await fetchChart(birthUTC);

  if (!response.ok) {
    throw new Error(response.error || "astro-service /chart failed");
  }

  return response;
}

/**
 * Small helper to sleep.
 */
function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * POST JSON to an internal route safely:
 * - hard timeout (prevents SSR hangs)
 * - bounded retry on 429
 * - does NOT throw (returns ok:false)
 */
async function postJsonSafe(path: string, payload: unknown): Promise<SafeResult> {
  const base = getAppBaseUrl();

  const timeoutMs = Number(process.env.INTERNAL_API_TIMEOUT_MS || 9000); // keep under nginx/proxy timeout
  const maxRetries429 = Number(process.env.INTERNAL_API_RETRY_429 || 1);

  for (let attempt = 0; attempt <= maxRetries429; attempt++) {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const r = await fetch(`${base}${path}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "cache-control": "no-store",
        },
        body: JSON.stringify(payload),
        cache: "no-store",
        signal: controller.signal,
      });

      clearTimeout(t);

      // Rate-limited: honor Retry-After if present, otherwise short backoff.
      if (r.status === 429) {
        const retryAfterHeader = r.headers.get("retry-after");
        const retryAfterSec = retryAfterHeader ? Number(retryAfterHeader) : NaN;
        const waitMs = Number.isFinite(retryAfterSec) ? retryAfterSec * 1000 : 400 + attempt * 400;

        if (attempt < maxRetries429) {
          await sleep(Math.min(waitMs, 2000));
          continue;
        }

        const text = await r.text().catch(() => "");
        return {
          ok: false,
          error: `${path} rate limited: 429`,
          status: 429,
          body: text.slice(0, 300),
        };
      }

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
      clearTimeout(t);

      const isAbort = err?.name === "AbortError";
      return {
        ok: false,
        error: isAbort ? `${path} timeout after ${timeoutMs}ms` : err?.message || `${path} fetch error`,
      };
    }
  }

  // should not reach
  return { ok: false, error: `${path} failed (unexpected)` };
}

/**
 * Atomic profile cache update with transaction safety.
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

  if (!hasBirth) return profile;

  /**
   * astro-service wants UTC parts
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
    // Send LOCAL birth inputs to app routes (they normalize)
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
      asOfDate: todayKey,
    };

    // Run them in parallel, but both are bounded by INTERNAL_API_TIMEOUT_MS
    const [ascRes, lunaRes] = await Promise.all([
      postJsonSafe("/api/asc-year", payloadLocal),
      postJsonSafe("/api/lunation", payloadLocal),
    ]);

    if (ascRes.ok) {
      ascYearJson = ascRes.data as unknown as Prisma.InputJsonValue;
      didDailyUpdate = true;
    } else {
      console.error("[ensureProfileCaches] asc-year FAILED:", ascRes.error, ascRes);
    }

    if (lunaRes.ok) {
      lunationJson = lunaRes.data as unknown as Prisma.InputJsonValue;
      didDailyUpdate = true;
    } else {
      console.error("[ensureProfileCaches] lunation FAILED:", lunaRes.error, lunaRes);
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
      console.warn("[ensureProfileCaches] Transaction conflict, re-fetching:", err);
      return await prisma.profile.findUnique({ where: { userId } });
    }
  }

  return profile;
}

export async function ensureProfileCaches(userId: number): Promise<Profile | null> {
  return withProfileLock(userId, () => ensureProfileCachesInternal(userId));
}
