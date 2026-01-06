// src/app/profile/page.tsx
import Link from "next/link";
import { requireUser } from "@/lib/auth/requireUser";
import { ensureProfileCaches } from "@/lib/profile/ensureProfileCaches";
import ProfileClient from "./ui/ProfileClient";
import { logoutAction } from "./actions";

// ---------- Calendar-style nav ----------
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
function safeNum(v: any): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

// ✅ handles number OR { lon: number }
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
  const planets = natal?.data?.planets ?? natal?.planets ?? natal?.data?.bodies ?? natal?.bodies ?? null;

  // ✅ broaden ASC extraction (sometimes stored as object)
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

// ✅ robust progressed lon extraction from lunation json (multiple fallbacks)
function getProgressedFromLunation(lunation: any) {
  const pSun =
    safeLon(lunation?.lunation?.progressedSunLon) ??
    safeLon(lunation?.progressedSunLon) ??
    safeLon(lunation?.data?.lunation?.progressedSunLon) ??
    safeLon(lunation?.data?.progressedSunLon) ??
    safeLon(lunation?.sep?.progressedSunLon) ??
    safeLon(lunation?.secondaryProgressions?.sunLon) ??
    safeLon(lunation?.progressed?.sunLon) ??
    null;

  const pMoon =
    safeLon(lunation?.lunation?.progressedMoonLon) ??
    safeLon(lunation?.progressedMoonLon) ??
    safeLon(lunation?.data?.lunation?.progressedMoonLon) ??
    safeLon(lunation?.data?.progressedMoonLon) ??
    safeLon(lunation?.sep?.progressedMoonLon) ??
    safeLon(lunation?.secondaryProgressions?.moonLon) ??
    safeLon(lunation?.progressed?.moonLon) ??
    null;

  return { progressedSunLon: pSun, progressedMoonLon: pMoon };
}

// ✅ current (as-of) Sun lon extraction (from core summary / asOf bodies)
function getCurrentSunLon(ascYear: any, natal: any, lunation: any) {
  // best: core summary shape (what your /api/lunation wrapper returns now)
  const s1 =
    safeLon(lunation?.summary?.asOf?.sun) ??
    safeLon(lunation?.summary?.asOf?.sunLon) ??
    safeLon(lunation?.summary?.asof?.sun) ??
    null;

  if (typeof s1 === "number") return s1;

  // fallback: if ascYear cache includes asOf sun
  const s2 =
    safeLon(ascYear?.summary?.asOf?.sun) ??
    safeLon(ascYear?.summary?.asOf?.sunLon) ??
    safeLon(ascYear?.asOf?.bodies?.sun?.lon) ??
    safeLon(ascYear?.asOf?.sunLon) ??
    null;

  if (typeof s2 === "number") return s2;

  // final fallback: natal sun (not ideal but better than empty)
  const natalPlanets = natal?.data?.planets ?? natal?.planets ?? natal?.data?.bodies ?? natal?.bodies ?? null;
  return safeLon(natalPlanets?.sun?.lon ?? natalPlanets?.sun);
}

export default async function ProfilePage() {
  const user = await requireUser();
  const profile = await ensureProfileCaches(user.id);

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
            <div
              className="text-[11px] tracking-[0.18em] uppercase"
              style={{ color: "rgba(31,36,26,0.55)", fontWeight: 800 }}
            >
              Setup
            </div>
            <div className="mt-2 text-2xl font-semibold tracking-tight" style={{ color: "rgba(31,36,26,0.92)" }}>
              Finish your profile
            </div>
            <div className="mt-3 text-sm" style={{ color: "rgba(31,36,26,0.72)" }}>
              Add birth details and location so URA can generate your live cycle.
            </div>

            <div className="mt-6">
              <Link href="/profile/setup" className="inline-block">
                <ActionPill>Continue</ActionPill>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const tz = profile.timezone ?? "America/New_York";
  const locationLine = [profile.city, profile.state].filter(Boolean).join(", ") || tz;

  const natal = profile.natalChartJson as any;
  const ascYear = profile.ascYearJson as any;
  const lunation = profile.lunationJson as any;

  const { planets, asc } = getNatalSources(natal);

  const natalSunLon = safeLon(planets?.sun?.lon ?? planets?.sun);
  const natalMoonLon = safeLon(planets?.moon?.lon ?? planets?.moon);
  const natalAscLon = safeLon(asc);

  // Asc-Year (authoritative for orientation)
  const cyclePos =
    safeNum(ascYear?.derived?.ascYear?.cyclePosition) ??
    safeNum(ascYear?.ascYear?.cyclePositionDeg) ??
    safeNum(ascYear?.ascYear?.cyclePosition) ??
    safeNum(ascYear?.cyclePositionDeg) ??
    safeNum(ascYear?.cyclePosition) ??
    safeNum(ascYear?.summary?.ascYearCyclePos);

  const ascYearSeason =
    (typeof ascYear?.derived?.ascYear?.season === "string" ? ascYear.derived.ascYear.season : null) ??
    (typeof ascYear?.ascYear?.season === "string" ? ascYear.ascYear.season : null) ??
    (typeof ascYear?.season === "string" ? ascYear.season : null) ??
    (typeof ascYear?.summary?.ascYearLabel === "string" ? ascYear.summary.ascYearLabel?.split("·")?.[0]?.trim() : null);

  const ascYearModality =
    (typeof ascYear?.derived?.ascYear?.modality === "string" ? ascYear.derived.ascYear.modality : null) ??
    (typeof ascYear?.ascYear?.modality === "string" ? ascYear.ascYear.modality : null) ??
    (typeof ascYear?.modality === "string" ? ascYear.modality : null);

  const ascYearDegreesIntoModality =
    safeNum(ascYear?.derived?.ascYear?.degreesIntoModality) ??
    safeNum(ascYear?.ascYear?.degreesIntoModality) ??
    safeNum(ascYear?.degreesIntoModality) ??
    safeNum(ascYear?.summary?.ascYearDegreesInto);

  // Progressed Sun/Moon (for “moving” slots)
  const { progressedSunLon, progressedMoonLon } = getProgressedFromLunation(lunation);

  // Current (as-of) Sun lon (for Current Zodiac + foundation Sun line)
  const currentSunLon = getCurrentSunLon(ascYear, natal, lunation);

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

            {/* ✅ NEW: Edit Profile route */}
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
          ascYearCyclePosDeg={cyclePos}
          ascYearSeason={ascYearSeason}
          ascYearModality={ascYearModality}
          ascYearDegreesIntoModality={ascYearDegreesIntoModality}
        />
      </div>
    </div>
  );
}
