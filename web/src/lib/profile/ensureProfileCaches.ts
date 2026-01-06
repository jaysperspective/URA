// src/lib/profile/ensureProfileCaches.ts
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

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

  // 1) A UTC guess for the same wall-clock time
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));

  // 2) Render that guess "as if" in the target timezone
  const asZonedString = utcGuess.toLocaleString("en-US", { timeZone: timezone });

  // 3) Parse back as Date (server local tz)
  const asZonedDate = new Date(asZonedString);

  // 4) Offset correction
  const diffMs = utcGuess.getTime() - asZonedDate.getTime();
  return new Date(utcGuess.getTime() + diffMs);
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
  const base = process.env.ASTRO_SERVICE_URL;
  if (!base) throw new Error("ASTRO_SERVICE_URL is missing.");

  const r = await fetch(`${base}/chart`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(birthUTC),
    cache: "no-store",
  });

  if (!r.ok) {
    const txt = await r.text().catch(() => "");
    throw new Error(`astro-service /chart failed: ${r.status} ${txt.slice(0, 200)}`);
  }

  return r.json();
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
 * Ensures the user's cached natal + daily outputs exist and are current.
 * - Natal: computed once (until birth data changes; edit should rebuild)
 * - Daily: recomputed once per local day (timezone-aware)
 */
export async function ensureProfileCaches(userId: number) {
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
    return await prisma.profile.update({
      where: { userId },
      data: {
        natalChartJson: (natalChartJson ?? Prisma.DbNull) as unknown as Prisma.InputJsonValue,
        natalUpdatedAt: needsNatal ? new Date() : profile.natalUpdatedAt,

        ascYearJson: (ascYearJson ?? Prisma.DbNull) as unknown as Prisma.InputJsonValue,
        lunationJson: (lunationJson ?? Prisma.DbNull) as unknown as Prisma.InputJsonValue,

        asOfDate: didDailyUpdate ? new Date() : profile.asOfDate,
        dailyUpdatedAt: didDailyUpdate ? new Date() : profile.dailyUpdatedAt,
      },
    });
  }

  return profile;
}
