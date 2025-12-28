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
  return `${y}-${m}-${day}`; // e.g. 2025-12-27
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

/**
 * NOTE: For daily caches, we do not want to hard-crash SSR if an endpoint is down
 * or returns non-OK. We return { ok:false } instead and let the caller decide.
 */
async function fetchAscYearSafe(payload: unknown) {
  const base = process.env.APP_BASE_URL;
  if (!base) {
    return { ok: false, error: "APP_BASE_URL is missing." as const };
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
        error: `/api/asc-year failed: ${r.status}` as const,
        status: r.status,
        body: text.slice(0, 300),
      };
    }

    const json = await r.json().catch(() => null);
    return { ok: true, data: json };
  } catch (err: any) {
    return { ok: false, error: err?.message || "asc-year fetch error" as const };
  }
}

async function fetchLunationSafe(payload: unknown) {
  const base = process.env.APP_BASE_URL;
  if (!base) {
    return { ok: false, error: "APP_BASE_URL is missing." as const };
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
        error: `/api/lunation failed: ${r.status}` as const,
        status: r.status,
        body: text.slice(0, 300),
      };
    }

    const json = await r.json().catch(() => null);
    return { ok: true, data: json };
  } catch (err: any) {
    return { ok: false, error: err?.message || "lunation fetch error" as const };
  }
}

/**
 * Ensures the user's cached natal + daily outputs exist and are current.
 * - Natal: computed once (until birth data changes; setup action clears caches)
 * - Daily: recomputed once per local day (timezone-aware)
 */
export async function ensureProfileCaches(userId: number) {
  const profile = await prisma.profile.findUnique({ where: { userId } });
  if (!profile) return null;

  const tz = profile.timezone || "America/New_York";

  // If profile isn't set up, don't compute anything
  if (!profile.setupDone) return profile;

  // Validate birth inputs (nullable in schema until setupDone is true)
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

  // ✅ Option A gate: if ANY birth fields are missing, do not compute caches here.
  // Let /profile redirect to /profile/setup.
  const hasBirth =
    typeof birthYear === "number" &&
    typeof birthMonth === "number" &&
    typeof birthDay === "number" &&
    typeof birthHour === "number" &&
    typeof birthMinute === "number" &&
    typeof birthLat === "number" &&
    typeof birthLon === "number";

  if (!hasBirth) return profile;

  const birth: BirthPayload = {
    year: birthYear,
    month: birthMonth,
    day: birthDay,
    hour: birthHour,
    minute: birthMinute,
    latitude: birthLat,
    longitude: birthLon,
  };

  // Determine if “today” changed since last cache (timezone-aware)
  const todayKey = getLocalDayKey(tz, new Date());
  const cachedKey = profile.asOfDate ? getLocalDayKey(tz, profile.asOfDate) : null;

  const needsDaily =
    !profile.ascYearJson ||
    !profile.lunationJson ||
    !profile.asOfDate ||
    cachedKey !== todayKey;

  const needsNatal = !profile.natalChartJson;

  // Prisma JSON typing: avoid passing plain `null` to JSON inputs
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
    // ✅ IMPORTANT: core expects lat/lon, not latitude/longitude.
    // We send BOTH (lat/lon as canonical; latitude/longitude for compatibility).
    const payload = {
      year: birth.year,
      month: birth.month,
      day: birth.day,
      hour: birth.hour,
      minute: birth.minute,

      // core contract
      lat: birth.latitude,
      lon: birth.longitude,

      // compatibility (harmless if ignored)
      latitude: birth.latitude,
      longitude: birth.longitude,

      timezone: tz,
      asOfDate: todayKey, // your APIs can ignore if not used
    };

    const [ascRes, lunaRes] = await Promise.all([
      fetchAscYearSafe(payload),
      fetchLunationSafe(payload),
    ]);

    if (ascRes.ok) {
      ascYearJson = ascRes.data as unknown as Prisma.InputJsonValue;
      didDailyUpdate = true;
    } else {
      // ✅ don't crash SSR — just log and keep previous ascYearJson if present
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
        // If somehow undefined, use DbNull instead of null
        natalChartJson: (natalChartJson ?? Prisma.DbNull) as unknown as Prisma.InputJsonValue,
        natalUpdatedAt: needsNatal ? new Date() : profile.natalUpdatedAt,

        ascYearJson: (ascYearJson ?? Prisma.DbNull) as unknown as Prisma.InputJsonValue,
        lunationJson: (lunationJson ?? Prisma.DbNull) as unknown as Prisma.InputJsonValue,

        // Only move the asOfDate forward if we successfully updated at least one daily blob
        asOfDate: didDailyUpdate ? new Date() : profile.asOfDate,
        dailyUpdatedAt: didDailyUpdate ? new Date() : profile.dailyUpdatedAt,
      },
    });
  }

  return profile;
}
