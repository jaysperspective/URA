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
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "radial-gradient(1200px 700px at 50% -10%, rgba(213,192,165,0.95) 0%, rgba(185,176,123,0.55) 55%, rgba(113,116,79,0.45) 120%)" }}>
        <div className="text-sm" style={{ color: "rgba(31,36,26,0.72)" }}>
          No profile found.
        </div>
      </div>
    );
  }

  if (!profile.setupDone) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "radial-gradient(1200px 700px at 50% -10%, rgba(213,192,165,0.95) 0%, rgba(185,176,123,0.55) 55%, rgba(113,116,79,0.45) 120%)" }}>
        <div className="w-full max-w-lg rounded-3xl border p-6" style={{ borderColor: "rgba(31,36,26,0.16)", background: "rgba(244,235,221,0.88)" }}>
          <div className="text-[11px] tracking-[0.18em] uppercase" style={{ color: "rgba(31,36,26,0.55)", fontWeight: 800 }}>
            Setup
          </div>
          <div className="mt-2 text-2xl font-semibold tracking-tight" style={{ color: "#1F241A" }}>
            Finish your profile
          </div>
          <div className="mt-3 text-sm" style={{ color: "rgba(31,36,26,0.72)" }}>
            Add birth details and location so URA can generate your live cycle.
          </div>
          <div className="mt-6">
            <Link
              href="/profile/setup"
              className="inline-flex items-center justify-center rounded-2xl border px-4 py-2 text-sm hover:opacity-95"
              style={{ borderColor: "rgba(31,36,26,0.16)", background: "rgba(244,235,221,0.78)", color: "#1F241A" }}
            >
              Continue
            </Link>
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

  const natalSunLon = safeNum(planets?.sun?.lon);
  const natalMoonLon = safeNum(planets?.moon?.lon);
  const natalAscLon = safeNum(asc);

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
    <div
      className="min-h-screen"
      style={{
        background:
          "radial-gradient(1200px 700px at 50% -10%, rgba(213,192,165,0.95) 0%, rgba(185,176,123,0.55) 55%, rgba(113,116,79,0.45) 120%)",
      }}
    >
      <div className="relative mx-auto w-full max-w-7xl px-6 py-10">
        <div className="flex items-center justify-between gap-4">
          <div className="text-[11px] tracking-[0.18em] uppercase" style={{ color: "rgba(31,36,26,0.55)", fontWeight: 800 }}>
            URA • Profile
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/profile/setup"
              className="inline-flex items-center justify-center rounded-2xl border px-4 py-2 text-sm hover:opacity-95"
              style={{ borderColor: "rgba(31,36,26,0.16)", background: "rgba(244,235,221,0.78)", color: "#1F241A" }}
            >
              Edit
            </Link>

            <form action={logoutAction}>
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-2xl border px-4 py-2 text-sm hover:opacity-95"
                style={{ borderColor: "rgba(31,36,26,0.16)", background: "rgba(244,235,221,0.78)", color: "#1F241A" }}
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
