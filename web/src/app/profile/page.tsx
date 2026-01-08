// src/app/profile/page.tsx
import Link from "next/link";
import { requireUser } from "@/lib/auth/requireUser";
import { prisma } from "@/lib/prisma";
import { ensureProfileCaches } from "@/lib/profile/ensureProfileCaches";
import ProfileClient from "./ui/ProfileClient";
import { logoutAction } from "./actions";
import { NAV, NavPill } from "@/lib/ui/nav";

function ActionPill({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="group relative overflow-hidden rounded-full border px-4 py-2 text-sm transition"
      style={{
        borderColor: "rgba(31,36,26,0.18)",
        background: "rgba(244,235,221,0.62)",
        color: "rgba(31,36,26,0.88)",
        boxShadow: "0 10px 30px rgba(31,36,26,0.08)",
      }}
    >
      <span
        className="pointer-events-none absolute inset-0 opacity-0 transition group-hover:opacity-100"
        style={{
          background:
            "linear-gradient(180deg, rgba(185,176,123,0.30) 0%, rgba(213,192,165,0.35) 55%, rgba(244,235,221,0.30) 120%)",
        }}
      />
      <span className="relative">{children}</span>
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

  const phase =
    (typeof lun?.phase === "string" && lun.phase) ||
    null;

  const subPhaseLabel =
    (typeof lun?.subPhase?.label === "string" && lun.subPhase.label) ||
    null;

  const subPhaseWithin =
    typeof lun?.subPhase?.within === "number" && Number.isFinite(lun.subPhase.within)
      ? lun.subPhase.within
      : null;

  const separation =
    typeof lun?.separation === "number" && Number.isFinite(lun.separation)
      ? lun.separation
      : null;

  return { phase, subPhaseLabel, subPhaseWithin, separation };
}

export default async function ProfilePage() {
  const user = await requireUser();

  // 1) load profile
  let profile = await prisma.profile.findUnique({ where: { userId: user.id } });

  const pageBg =
    "radial-gradient(1200px 700px at 50% -10%, rgba(244,235,221,0.55), rgba(255,255,255,0) 60%), linear-gradient(180deg, rgba(245,240,232,0.70), rgba(245,240,232,0.92))";

  if (!profile) {
    return (
      <div className="min-h-screen px-4 py-8" style={{ background: pageBg }}>
        <div className="mx-auto w-full max-w-5xl">
          <div
            className="rounded-3xl border p-6"
            style={{
              borderColor: "rgba(31,36,26,0.16)",
              background: "rgba(244,235,221,0.78)",
              boxShadow: "0 18px 50px rgba(31,36,26,0.10)",
            }}
          >
            <div className="text-sm" style={{ color: "rgba(31,36,26,0.72)" }}>
              No profile found.
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2) If setup is done but caches are missing, rebuild ONCE
  const needsCacheRebuild =
    !!profile.setupDone &&
    (!profile.natalChartJson || !profile.lunationJson || !profile.ascYearJson);

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
      <div className="min-h-screen px-4 py-8" style={{ background: pageBg }}>
        <div className="mx-auto w-full max-w-5xl">
          <div
            className="rounded-3xl border p-6"
            style={{
              borderColor: "rgba(31,36,26,0.16)",
              background: "rgba(244,235,221,0.78)",
              boxShadow: "0 18px 50px rgba(31,36,26,0.10)",
            }}
          >
            <div className="text-sm" style={{ color: "rgba(31,36,26,0.72)" }}>
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
      <div className="min-h-screen px-4 py-8" style={{ background: pageBg }}>
        <div className="mx-auto w-full max-w-5xl">
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-baseline justify-between md:block">
              <div className="text-xs tracking-[0.28em] uppercase" style={{ color: "rgba(31,36,26,0.55)" }}>
                URA
              </div>
              <div className="mt-1 text-lg font-semibold tracking-tight" style={{ color: "rgba(31,36,26,0.90)" }}>
                Profile
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {NAV.map((n) => (
                <NavPill key={n.href} href={n.href} label={n.label} active={n.href === "/profile"} />
              ))}
            </div>
          </div>

          <div
            className="w-full rounded-3xl border p-6"
            style={{
              borderColor: "rgba(31,36,26,0.16)",
              background: "rgba(244,235,221,0.86)",
              boxShadow: "0 18px 50px rgba(31,36,26,0.10)",
            }}
          >
            <div className="text-[11px] tracking-[0.18em] uppercase" style={{ color: "rgba(31,36,26,0.55)", fontWeight: 800 }}>
              Setup
            </div>
            <div className="mt-2 text-2xl font-semibold tracking-tight" style={{ color: "rgba(31,36,26,0.92)" }}>
              Finish your profile
            </div>
            <div className="mt-3 text-sm" style={{ color: "rgba(31,36,26,0.72)" }}>
              Add birth details and location so URA can generate your live cycle.
            </div>

            <div className="mt-6">
              <Link href="/profile/edit" className="inline-block">
                <ActionPill>Continue</ActionPill>
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
    <div className="min-h-screen px-4 py-8" style={{ background: pageBg }}>
      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-baseline justify-between md:block">
            <div className="text-xs tracking-[0.28em] uppercase" style={{ color: "rgba(31,36,26,0.55)" }}>
              URA
            </div>
            <div className="mt-1 text-lg font-semibold tracking-tight" style={{ color: "rgba(31,36,26,0.90)" }}>
              Profile
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {NAV.map((n) => (
              <NavPill key={n.href} href={n.href} label={n.label} active={n.href === "/profile"} />
            ))}

            <Link href="/profile/edit" aria-label="Edit profile">
              <ActionPill>Edit</ActionPill>
            </Link>

            <form action={logoutAction}>
              <button type="submit" aria-label="Log out">
                <ActionPill>Log out</ActionPill>
              </button>
            </form>
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
        />
      </div>
    </div>
  );
}
