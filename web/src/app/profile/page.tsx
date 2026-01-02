// src/app/profile/page.tsx
import Link from "next/link";
import { requireUser } from "@/lib/auth/requireUser";
import { ensureProfileCaches } from "@/lib/profile/ensureProfileCaches";
import ProfileClient from "./ui/ProfileClient";
import { logoutAction } from "./actions";

// ---------- helpers ----------
function safeNum(v: any): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function norm360(d: number) {
  let x = d % 360;
  if (x < 0) x += 360;
  return x;
}

const SIGNS = [
  "Ari",
  "Tau",
  "Gem",
  "Can",
  "Leo",
  "Vir",
  "Lib",
  "Sco",
  "Sag",
  "Cap",
  "Aqu",
  "Pis",
] as const;

function signFromLon(lon: number) {
  const idx = Math.floor(norm360(lon) / 30) % 12;
  return SIGNS[idx];
}

function fmtLon(lon: number) {
  const x = norm360(lon);
  const degInSign = x % 30;
  const d = Math.floor(degInSign);
  const m = Math.floor((degInSign - d) * 60);
  return `${d}° ${String(m).padStart(2, "0")}'`;
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
  const asc = natal?.data?.ascendant ?? natal?.ascendant ?? natal?.asc ?? null;
  return { planets, asc };
}

export default async function ProfilePage() {
  const user = await requireUser();
  const profile = await ensureProfileCaches(user.id);

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#0B0B0B] text-[#F4EFE6] flex items-center justify-center px-6">
        <div className="text-[#F4EFE6]/70 text-sm">No profile found.</div>
      </div>
    );
  }

  if (!profile.setupDone) {
    return (
      <div className="min-h-screen bg-[#0B0B0B] text-[#F4EFE6] flex items-center justify-center px-6">
        <div className="w-full max-w-lg rounded-3xl border border-[#E2D9CC]/30 bg-[#121212] p-6">
          <div className="text-[11px] tracking-[0.18em] uppercase text-[#F4EFE6]/60">
            Setup
          </div>
          <div className="mt-2 text-2xl font-semibold tracking-tight text-[#F4EFE6]">
            Finish your profile
          </div>
          <div className="mt-3 text-sm text-[#F4EFE6]/70">
            Add birth details and location so URA can generate your live cycle.
          </div>
          <div className="mt-6">
            <Link
              href="/profile/setup"
              className="inline-flex items-center justify-center rounded-2xl border border-[#E2D9CC]/40 bg-[#1A1A1A] px-4 py-2 text-sm text-[#F4EFE6] hover:bg-[#222]"
            >
              Continue
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const tz = profile.timezone ?? "America/New_York";
  const locationLine =
    [profile.city, profile.state].filter(Boolean).join(", ") || tz;

  const natal = profile.natalChartJson as any;
  const ascYear = profile.ascYearJson as any;
  const lunation = profile.lunationJson as any;

  const { planets, asc } = getNatalSources(natal);

  const natalSunLon = safeNum(planets?.sun?.lon);
  const natalMoonLon = safeNum(planets?.moon?.lon);
  const natalAscLon = safeNum(asc);

  // moving bodies (as-of) — still wired, we’ll swap to progressed later
  const movingSunLon =
    safeNum(ascYear?.ascYear?.transitingSunLon) ??
    safeNum(ascYear?.ascYear?.sunLon) ??
    safeNum(ascYear?.transitingSunLon) ??
    safeNum(ascYear?.sunLon);

  const movingMoonLon =
    safeNum(lunation?.moonLon) ??
    safeNum(lunation?.data?.moonLon) ??
    safeNum(lunation?.lunation?.moonLon) ??
    safeNum(lunation?.raw?.moonLon);

  const cyclePos =
    safeNum(ascYear?.ascYear?.cyclePositionDeg) ??
    safeNum(ascYear?.ascYear?.cyclePosition) ??
    safeNum(ascYear?.cyclePositionDeg) ??
    safeNum(ascYear?.cyclePosition);

  const asOfISO = profile.asOfDate ? profile.asOfDate.toISOString() : null;
  const name = pickName(user, profile);

  return (
    <div className="min-h-screen bg-[#0B0B0B]">
      {/* Moonstone atmosphere */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.06),rgba(0,0,0,0)_58%)]" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(244,239,230,0.06),rgba(0,0,0,0)_60%)]" />

      <div className="relative mx-auto w-full max-w-7xl px-6 py-10">
        <div className="flex items-center justify-between gap-4">
          <div className="text-[#F4EFE6]/70 text-[11px] tracking-[0.18em] uppercase">
            URA • Profile
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/profile/setup"
              className="inline-flex items-center justify-center rounded-2xl border border-[#E2D9CC]/40 bg-[#151515] px-4 py-2 text-sm text-[#F4EFE6] hover:bg-[#1E1E1E]"
            >
              Edit
            </Link>

            <form action={logoutAction}>
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-2xl border border-[#E2D9CC]/40 bg-[#151515] px-4 py-2 text-sm text-[#F4EFE6] hover:bg-[#1E1E1E]"
              >
                Log out
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
          movingSunLon={movingSunLon}
          movingMoonLon={movingMoonLon}
          cyclePosDeg={cyclePos}
        />
      </div>
    </div>
  );
}
