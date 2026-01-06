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
 * Avoids treating local birth time as UTC.
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

  // UTC guess for same wall-clock time
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));

  // Render that guess as if it were in the target timezone
  const asZonedString = utcGuess.toLocaleString("en-US", { timeZone: timezone });

  // Parse back as Date (server local tz)
  const asZonedDate = new Date(asZonedString);

  // Offset correction
  const diffMs = utcGuess.getTime() - asZonedDate.getTime();
  return new Date(utcGuess.getTime() + diffMs);
}

function safeLon(v: any): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (v && typeof v === "object" && typeof v.lon === "number" && Number.isFinite(v.lon)) return v.lon;
  return null;
}

function extractNatalAscLon(natal: any): number | null {
  const asc =
    natal?.data?.ascendant ??
    natal?.data?.angles?.asc ??
    natal?.data?.angles?.ascendant ??
    natal?.data?.houses?.ascendant ??
    natal?.ascendant ??
    natal?.asc ??
    natal?.angles?.asc ??
    natal?.angles?.ascendant ??
    null;

  return safeLon(asc);
}

function extractAsOfSunLonFromLunation(lunationJson: any): number | null {
  // your /api/lunation response includes summary.asOf.sun in the sample output
  const v =
    lunationJson?.summary?.asOf?.sun ??
    lunationJson?.asOf?.sun ??
    lunationJson?.data?.summary?.asOf?.sun ??
    null;

  return safeLon(v);
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
 * NOTE: For daily caches, do not hard-crash SSR if endpoints fail.
 */
async function fetchJsonSafe(url: string, payload: unknown) {
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    if (!r.ok) {
      const text = await r.text().catch(() => "");
      return {
        ok: false as boolean,
        error: `${url} failed: ${r.status}`,
        status: r.status,
        body: text.slice(0, 300),
      };
    }

    const json = await r.json().catch(() => null);
    return { ok: true as boolean, data: json };
  } catch (err: any) {
    return { ok: false as boolean, error: err?.message || "fetch error" };
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

  // ✅ Convert local birth time (tz) -> UTC for astro-service (natal correctness)
  const birthUTC = zonedLocalToUtcDate({
    year: birthYear,
    month: birthMonth,
    day: birthDay,
    hour: birthHour,
    minute: birthMinute,
    timezone: tz,
  });

  const birthForAstro: BirthPayload = {
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

  // Prisma JSON typing: avoid passing plain `null`
  let natalChartJson: Prisma.InputJsonValue | undefined =
    (profile.natalChartJson ?? undefined) as unknown as Prisma.InputJsonValue | undefined;

  let ascYearJson: Prisma.InputJsonValue | undefined =
    (profile.ascYearJson ?? undefined) as unknown as Prisma.InputJsonValue | undefined;

  let lunationJson: Prisma.InputJsonValue | undefined =
    (profile.lunationJson ?? undefined) as unknown as Prisma.InputJsonValue | undefined;

  if (needsNatal) {
    natalChartJson = (await fetchAstroNatal(birthForAstro)) as unknown as Prisma.InputJsonValue;
  }

  let didDailyUpdate = false;

  if (needsDaily) {
    const base = process.env.APP_BASE_URL;
    if (!base) {
      console.warn("[ensureProfileCaches] APP_BASE_URL missing; skipping daily caches");
    } else {
      // ✅ natalAscLon extracted from cached natal (authoritative ASC)
      const natalAscLon = extractNatalAscLon(natalChartJson);

      // Lunation expects your existing payload contract (keep compatibility)
      const lunationPayload = {
        birth_datetime: `${birthYear}-${String(birthMonth).padStart(2, "0")}-${String(birthDay).padStart(
          2,
          "0"
        )} ${String(birthHour).padStart(2, "0")}:${String(birthMinute).padStart(2, "0")}`,
        tz_offset: null, // optional; your lunation route can ignore if it uses timezone
        as_of_date: todayKey,
        lat: birthLat,
        lon: birthLon,
        timezone: tz,
      };

      const lunaRes = await fetchJsonSafe(`${base}/api/lunation`, lunationPayload);

      if (lunaRes.ok) {
        lunationJson = lunaRes.data as unknown as Prisma.InputJsonValue;
        didDailyUpdate = true;
      } else {
        console.warn("[ensureProfileCaches] lunation skipped:", lunaRes);
      }

      // ✅ Use lunation summary as-of sun for asc-year (authoritative transiting Sun)
      const transitingSunLon =
        (lunaRes.ok ? extractAsOfSunLonFromLunation(lunaRes.data) : null) ?? null;

      const ascYearPayload = {
        natalAscLon,
        transitingSunLon,

        // keep extra context (harmless)
        timezone: tz,
        asOfDate: todayKey,
        lat: birthLat,
        lon: birthLon,
      };

      const ascRes = await fetchJsonSafe(`${base}/api/asc-year`, ascYearPayload);

      if (ascRes.ok) {
        ascYearJson = ascRes.data as unknown as Prisma.InputJsonValue;
        didDailyUpdate = true;
      } else {
        console.warn("[ensureProfileCaches] asc-year skipped:", ascRes);
      }
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
