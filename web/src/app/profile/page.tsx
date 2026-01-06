// src/app/profile/page.tsx
import Link from "next/link";
import { requireUser } from "@/lib/auth/requireUser";
import { prisma } from "@/lib/prisma";
import { ensureProfileCaches } from "@/lib/profile/ensureProfileCaches";
import ProfileClient from "./ui/ProfileClient";
import { logoutAction } from "./actions";

const NAV = [
  { href: "/calendar", label: "Calendar" },
  { href: "/moon", label: "Moon" },
  { href: "/profile", label: "Profile" },
  { href: "/lunation", label: "Lunation" },
] as const;

function NavPill({
  href,
  label,
  active,
}: {
  href: (typeof NAV)[number]["href"];
  label: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-full border px-4 py-2 text-sm transition"
      style={{
        borderColor: active ? "rgba(31,36,26,0.30)" : "rgba(31,36,26,0.18)",
        background: active ? "rgba(244,235,221,0.80)" : "rgba(244,235,221,0.62)",
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
      <span className="relative flex items-center gap-2">
        <span
          className="inline-block h-2 w-2 rounded-full opacity-70"
          style={{ background: active ? "rgba(31,36,26,0.60)" : "rgba(31,36,26,0.45)" }}
        />
        <span className="tracking-wide">{label}</span>
      </span>
    </Link>
  );
}

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

  return { planets, asc };
}

function getProgressedFromLunation(lunation: any) {
  const pSun =
    safeLon(lunation?.lunation?.progressedSunLon) ??
    safeLon(lunation?.progressedSunLon) ??
    safeLon(lunation?.data?.lunation?.progressedSunLon) ??
    null;

  const pMoon =
    safeLon(lunation?.lunation?.progressedMoonLon) ??
    safeLon(lunation?.progressedMoonLon) ??
    safeLon(lunation?.data?.lunation?.progressedMoonLon) ??
    null;

  return { progressedSunLon: pSun, progressedMoonLon: pMoon };
}

function getAsOfSunFromLunation(lunation: any) {
  return safeLon(lunation?.summary?.asOf?.sun) ?? safeLon(lunation?.data?.summary?.asOf?.sun) ?? null;
}

function getAscYearCyclePosDeg(ascYearJson: any): number | null {
  // Your asc-year route returns: { ok: true, ascYear: { cyclePositionDeg: ... } }
  const v =
    ascYearJson?.ascYear?.cyclePositionDeg ??
    ascYearJson?.ascYear?.cyclePosition ??
    ascYearJson?.cyclePositionDeg ??
    ascYearJson?.cyclePosition ??
    null;

  return typeof v === "number" && Number.isFinite(v) ? v : null;
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

  // 2) If setup is done but caches are missing, rebuild ONCE (safe, avoids CPU melt)
  const needsCacheRebuild =
    !!profile.setupDone &&
    (!profile.natalChartJson || !profile.lunationJson || !profile.ascYearJson);

  if (needsCacheRebuild) {
    try {
      await ensureProfileCaches(user.id);
      profile = await prisma.profile.findUnique({ where: { userId: user.id } });
    } catch (e) {
      // do not crash profile render
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

  const { planets, asc } = getNatalSources(natal);

  const natalSunLon = safeLon(planets?.sun?.lon ?? planets?.sun);
  const natalMoonLon = safeLon(planets?.moon?.lon ?? planets?.moon);
  const natalAscLon = safeLon(asc);

  const { progressedSunLon, progressedMoonLon } = getProgressedFromLunation(lunation);
  const currentSunLon = getAsOfSunFromLunation(lunation);

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
          natalSunLon={natalSunLon}
          natalMoonLon={natalMoonLon}
          currentSunLon={currentSunLon}
          progressedSunLon={progressedSunLon}
          progressedMoonLon={progressedMoonLon}
          ascYearCyclePosDeg={ascYearCyclePosDeg}
          ascYearSeason={ascYearSeason}
          ascYearModality={ascYearModality}
          ascYearDegreesIntoModality={ascYearDegreesIntoModality}
        />
      </div>
    </div>
  );
}
