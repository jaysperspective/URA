// src/lib/profile/ensureProfileCaches.ts
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

type BirthPayload = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  latitude: number;
  longitude: number;
};

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
 * Convert a "wall clock" local time in a timezone into a UTC Date.
 * This avoids the classic bug: treating local birth time as UTC.
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

  // 2) Render that guess as if it were in the target timezone (string)
  const asZonedString = utcGuess.toLocaleString("en-US", { timeZone: timezone });

  // 3) Parse back as Date (server local tz)
  const asZonedDate = new Date(asZonedString);

  // 4) Offset correction
  const diffMs = utcGuess.getTime() - asZonedDate.getTime();

  return new Date(utcGuess.getTime() + diffMs);
}

async function fetchAstroNatal(birth: BirthPayload) {
  const base = process.env.ASTRO_SERVICE_URL;
  if (!base) throw new Error("ASTRO_SERVICE_URL is missing.");

  const r = await fetch(`${base}/chart`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(birth),
    cache: "no-store",
  });

  if (!r.ok) throw new Error(`astro-service /chart failed: ${r.status}`);
  return r.json();
}

async function fetchAscYearSafe(payload: unknown) {
  const base = process.env.APP_BASE_URL;
  if (!base) {
    return { ok: false, error: "APP_BASE_URL is missing." };
  }

  try {
    const r = await fetch(`${base}/api/asc-year`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    if (!r.ok) {
      const text = await r.text().catch(() => "");
      return {
        ok: false,
        error: `/api/asc-year failed: ${r.status}`,
        status: r.status,
        body: text.slice(0, 300),
      };
    }

    const json = await r.json().catch(() => null);
    return { ok: true, data: json };
  } catch (err: any) {
    const msg: string = err?.message || "asc-year fetch error";
    return { ok: false, error: msg };
  }
}

async function fetchLunationSafe(payload: unknown) {
  const base = process.env.APP_BASE_URL;
  if (!base) {
    return { ok: false, error: "APP_BASE_URL is missing." };
  }

  try {
    const r = await fetch(`${base}/api/lunation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    if (!r.ok) {
      const text = await r.text().catch(() => "");
      return {
        ok: false,
        error: `/api/lunation failed: ${r.status}`,
        status: r.status,
        body: text.slice(0, 300),
      };
    }

    const json = await r.json().catch(() => null);
    return { ok: true, data: json };
  } catch (err: any) {
    const msg: string = err?.message || "lunation fetch error";
    return { ok: false, error: msg };
  }
}

/**
 * Ensures the user's cached natal + daily outputs exist and are current.
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

  if (!hasBirth) return profile;

  // ✅ Convert the user's local birth time (tz) into UTC parts for astro-service
  const birthUTC = zonedLocalToUtcDate({
    year: birthYear,
    month: birthMonth,
    day: birthDay,
    hour: birthHour,
    minute: birthMinute,
    timezone: tz,
  });

  const birth: BirthPayload = {
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
    natalChartJson = (await fetchAstroNatal(birth)) as unknown as Prisma.InputJsonValue;
  }

  let didDailyUpdate = false;

  if (needsDaily) {
    const payload = {
      year: birth.year,
      month: birth.month,
      day: birth.day,
      hour: birth.hour,
      minute: birth.minute,

      // core contract
      lat: birth.latitude,
      lon: birth.longitude,

      // compatibility
      latitude: birth.latitude,
      longitude: birth.longitude,

      timezone: tz,
      asOfDate: todayKey,
    };

    const [ascRes, lunaRes] = await Promise.all([
      fetchAscYearSafe(payload),
      fetchLunationSafe(payload),
    ]);

    if ((ascRes as any).ok) {
      ascYearJson = (ascRes as any).data as unknown as Prisma.InputJsonValue;
      didDailyUpdate = true;
    } else {
      console.warn("[ensureProfileCaches] asc-year skipped:", ascRes);
    }

    if ((lunaRes as any).ok) {
      lunationJson = (lunaRes as any).data as unknown as Prisma.InputJsonValue;
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
