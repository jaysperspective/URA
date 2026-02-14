// src/app/profile/page.tsx
export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureProfileCaches } from "@/lib/profile/ensureProfileCaches";
import ProfileClient from "./ui/ProfileClient";
import DeleteAccountButton from "./ui/DeleteAccountButton";
import { logoutAction } from "./actions";

// Handoff params from /sun
type HandoffParams = {
  from?: string;
  ts?: string;
  focus?: string;
  dominant?: "solar" | "lunar" | "transitional";
};

function ActionPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="ura-btn-secondary text-sm">
      {children}
    </span>
  );
}

// ---------- helpers ----------
function safeLon(v: any): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (v && typeof v === "object" && typeof v.lon === "number" && Number.isFinite(v.lon)) return v.lon;
  return null;
}

function pickName(user: any, profile: any) {
  const p = profile?.username?.trim();
  if (p) return p;
  const email = (user?.email ?? "").toString();
  if (email.includes("@")) return email.split("@")[0];
  return email || "Profile";
}

function getNatalSources(natal: any) {
  const planets = natal?.data?.planets ?? natal?.planets ?? null;

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

  const mc =
    natal?.data?.mc ??
    natal?.data?.angles?.mc ??
    natal?.data?.angles?.midheaven ??
    natal?.mc ??
    natal?.angles?.mc ??
    natal?.angles?.midheaven ??
    null;

  return { planets, asc, mc };
}

function getProgressedFromLunation(lunation: any) {
  const pSun =
    safeLon(lunation?.lunation?.progressedSunLon) ??
    safeLon(lunation?.progressedSunLon) ??
    safeLon(lunation?.data?.lunation?.progressedSunLon) ??
    safeLon(lunation?.derived?.lunation?.progressedSunLon) ??
    null;

  const pMoon =
    safeLon(lunation?.lunation?.progressedMoonLon) ??
    safeLon(lunation?.progressedMoonLon) ??
    safeLon(lunation?.data?.lunation?.progressedMoonLon) ??
    safeLon(lunation?.derived?.lunation?.progressedMoonLon) ??
    null;

  return { progressedSunLon: pSun, progressedMoonLon: pMoon };
}

function getAsOfSunFromLunation(lunation: any) {
  return (
    safeLon(lunation?.summary?.asOf?.sun) ??
    safeLon(lunation?.data?.summary?.asOf?.sun) ??
    safeLon(lunation?.derived?.summary?.asOf?.sun) ??
    null
  );
}

function getAscYearCyclePosDeg(ascYearJson: any): number | null {
  const v =
    ascYearJson?.ascYear?.cyclePositionDeg ??
    ascYearJson?.ascYear?.cyclePosition ??
    ascYearJson?.cyclePositionDeg ??
    ascYearJson?.cyclePosition ??
    null;

  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function buildNatalPlanets(planets: any) {
  const read = (...keys: string[]) => {
    for (const k of keys) {
      const v = safeLon(planets?.[k]?.lon ?? planets?.[k]);
      if (typeof v === "number") return v;
    }
    return null;
  };

  return {
    sun: read("sun", "Sun"),
    moon: read("moon", "Moon"),
    mercury: read("mercury", "Mercury"),
    venus: read("venus", "Venus"),
    mars: read("mars", "Mars"),
    jupiter: read("jupiter", "Jupiter"),
    saturn: read("saturn", "Saturn"),
    uranus: read("uranus", "Uranus"),
    neptune: read("neptune", "Neptune"),
    pluto: read("pluto", "Pluto"),
    chiron: read("chiron", "Chiron"),
    northNode: read("northNode", "north_node", "trueNode", "true_node", "meanNode", "mean_node", "node", "rahu"),
    southNode: read("southNode", "south_node", "ketu"),
  } as const;
}

function getLunationPhaseInfo(lunationJson: any) {
  const lun =
    lunationJson?.lunation ??
    lunationJson?.data?.lunation ??
    lunationJson?.derived?.lunation ??
    null;

  const phase = (typeof lun?.phase === "string" && lun.phase) || null;

  const subPhaseLabel = (typeof lun?.subPhase?.label === "string" && lun.subPhase.label) || null;

  const subPhaseWithin =
    typeof lun?.subPhase?.within === "number" && Number.isFinite(lun.subPhase.within)
      ? lun.subPhase.within
      : null;

  const separation =
    typeof lun?.separation === "number" && Number.isFinite(lun.separation) ? lun.separation : null;

  return { phase, subPhaseLabel, subPhaseWithin, separation };
}

// local-day key helper (timezone aware)
function localDayKey(timezone: string, d = new Date()) {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(d);

    const y = parts.find((p) => p.type === "year")?.value;
    const m = parts.find((p) => p.type === "month")?.value;
    const day = parts.find((p) => p.type === "day")?.value;

    if (!y || !m || !day) return d.toISOString().slice(0, 10);
    return `${y}-${m}-${day}`;
  } catch {
    return d.toISOString().slice(0, 10);
  }
}

type PageProps = {
  searchParams: Promise<HandoffParams>;
};

export default async function ProfilePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const user = await getCurrentUser();

  // Guest landing page — no auth required
  if (!user) {
    return (
      <div className="min-h-screen px-4 py-8">
        <div className="mx-auto w-full max-w-5xl">
          <div className="mb-5">
            <div className="ura-section-label">URA</div>
            <div className="ura-page-title mt-1">Profile</div>
          </div>

          <div className="ura-card rounded-2xl p-6">
            <div className="text-2xl font-semibold tracking-tight" style={{ color: "var(--ura-text-primary)" }}>
              Sign in to access your profile
            </div>
            <div className="mt-3 text-sm" style={{ color: "var(--ura-text-secondary)" }}>
              Your profile holds your personal timing, birth data, and live cycle. Create an account or sign in to get started.
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/login" className="ura-btn-secondary inline-block py-2.5 px-5 text-sm font-medium">
                Sign in
              </Link>
              <Link href="/signup" className="ura-btn-secondary inline-block py-2.5 px-5 text-sm font-medium">
                Create account
              </Link>
            </div>

            <div className="mt-5 pt-4" style={{ borderTop: "1px solid var(--ura-border-subtle)" }}>
              <div className="text-xs" style={{ color: "var(--ura-text-muted)" }}>
                Just browsing?
              </div>
              <Link
                href="/sun"
                className="inline-block mt-2 text-sm font-medium"
                style={{ color: "var(--ura-accent-secondary)" }}
              >
                Continue exploring as guest
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Check if this is a handoff from /sun
  const isHandoff = params.from === "sun";
  const handoffData = isHandoff
    ? {
        from: params.from,
        ts: params.ts,
        focus: params.focus,
        dominant: params.dominant,
      }
    : null;

  // 1) load profile
  let profile = await prisma.profile.findUnique({ where: { userId: user.id } });

  if (!profile) {
    return (
      <div className="min-h-screen px-4 py-8">
        <div className="mx-auto w-full max-w-5xl">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <div className="ura-section-label">URA</div>
              <div className="ura-page-title mt-1">Profile</div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <form action={logoutAction}>
                <button type="submit" aria-label="Log out">
                  <ActionPill>Log out</ActionPill>
                </button>
              </form>
              <DeleteAccountButton />
            </div>
          </div>
          <div className="ura-card p-6">
            <div className="text-sm ura-text-secondary">
              No profile found.
            </div>
          </div>
        </div>
      </div>
    );
  }

  // timezone as early as possible (used for staleness logic)
  const tzEarly = profile.timezone ?? "America/New_York";

  // 2) Rebuild caches if missing OR stale (daily refresh)
  const missingCaches =
    !!profile.setupDone && (!profile.natalChartJson || !profile.lunationJson || !profile.ascYearJson);

  const staleDaily =
    !!profile.setupDone &&
    (!profile.asOfDate || localDayKey(tzEarly, profile.asOfDate) !== localDayKey(tzEarly, new Date()));

  const needsCacheRebuild = missingCaches || staleDaily;

  if (needsCacheRebuild) {
    try {
      await ensureProfileCaches(user.id);
      profile = await prisma.profile.findUnique({ where: { userId: user.id } });
    } catch (e) {
      console.warn("[/profile] ensureProfileCaches failed:", e);
    }
  }

  if (!profile) {
    return (
      <div className="min-h-screen px-4 py-8">
        <div className="mx-auto w-full max-w-5xl">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <div className="ura-section-label">URA</div>
              <div className="ura-page-title mt-1">Profile</div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <form action={logoutAction}>
                <button type="submit" aria-label="Log out">
                  <ActionPill>Log out</ActionPill>
                </button>
              </form>
              <DeleteAccountButton />
            </div>
          </div>
          <div className="ura-card p-6">
            <div className="text-sm ura-text-secondary">
              No profile found.
            </div>
          </div>
        </div>
      </div>
    );
  }

  // setup gate
  if (!profile.setupDone) {
    return (
      <div className="min-h-screen px-4 py-8">
        <div className="mx-auto w-full max-w-5xl">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <div className="ura-section-label">URA</div>
              <div className="ura-page-title mt-1">Profile</div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <form action={logoutAction}>
                <button type="submit" aria-label="Log out">
                  <ActionPill>Log out</ActionPill>
                </button>
              </form>
              <DeleteAccountButton />
            </div>
          </div>

          <div className="ura-card p-6">
            <div className="ura-section-label">Setup</div>
            <div className="mt-2 text-2xl font-semibold tracking-tight ura-text-primary">
              Finish your profile
            </div>
            <div className="mt-3 text-sm ura-text-secondary">
              Add birth details and location so URA can generate your live cycle.
            </div>

            <div className="mt-6">
              <Link href="/profile/edit" className="ura-btn-primary inline-block">
                Continue
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const tz = profile.timezone ?? "America/New_York";
  const locationLine =
    profile.birthPlace?.trim() || [profile.city, profile.state].filter(Boolean).join(", ") || tz;

  const natal = profile.natalChartJson as any;
  const ascYear = profile.ascYearJson as any;
  const lunation = profile.lunationJson as any;

  const { planets, asc, mc } = getNatalSources(natal);
  const natalPlanets = buildNatalPlanets(planets);

  const natalSunLon = safeLon(natalPlanets.sun);
  const natalMoonLon = safeLon(natalPlanets.moon);
  const natalAscLon = safeLon(asc);
  const natalMcLon = safeLon(mc);

  const { progressedSunLon, progressedMoonLon } = getProgressedFromLunation(lunation);
  const currentSunLon = getAsOfSunFromLunation(lunation);

  const { phase: lunPhase, subPhaseLabel: lunSubPhaseLabel, subPhaseWithin: lunSubPhaseWithin, separation: lunSeparation } =
    getLunationPhaseInfo(lunation);

  const ascYearCyclePosDeg = getAscYearCyclePosDeg(ascYear);

  const ascYearSeason = (ascYear?.ascYear?.season as string | undefined) ?? null;
  const ascYearModality = (ascYear?.ascYear?.modality as string | undefined) ?? null;
  const ascYearDegreesIntoModality =
    typeof ascYear?.ascYear?.degreesIntoModality === "number" ? ascYear.ascYear.degreesIntoModality : null;

  const asOfISO = profile.asOfDate ? profile.asOfDate.toISOString() : null;
  const name = pickName(user, profile);

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <div className="ura-section-label">URA</div>
            <div className="ura-page-title mt-1">Profile</div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link href="/profile/edit" aria-label="Edit profile">
              <ActionPill>Edit</ActionPill>
            </Link>

            <form action={logoutAction}>
              <button type="submit" aria-label="Log out">
                <ActionPill>Log out</ActionPill>
              </button>
            </form>

            <DeleteAccountButton />
          </div>
        </div>

        <ProfileClient
          name={name}
          locationLine={locationLine}
          timezone={tz}
          asOfISO={asOfISO}
          natalAscLon={natalAscLon}
          natalMcLon={natalMcLon}
          natalSunLon={natalSunLon}
          natalMoonLon={natalMoonLon}
          natalPlanets={natalPlanets}
          currentSunLon={currentSunLon}
          progressedSunLon={progressedSunLon}
          progressedMoonLon={progressedMoonLon}
          lunationPhase={lunPhase}
          lunationSubPhase={lunSubPhaseLabel}
          lunationSubWithinDeg={lunSubPhaseWithin}
          lunationSeparationDeg={lunSeparation}
          ascYearCyclePosDeg={ascYearCyclePosDeg}
          ascYearSeason={ascYearSeason}
          ascYearModality={ascYearModality}
          ascYearDegreesIntoModality={ascYearDegreesIntoModality}
          handoffFromSun={handoffData}
          avatarUrl={profile.avatarUrl ?? null}
        />
      </div>
    </div>
  );
}
