// src/app/profile/page.tsx
import Link from "next/link";
import { headers } from "next/headers";
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
        background: active
          ? "rgba(244,235,221,0.80)"
          : "rgba(244,235,221,0.62)",
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
          style={{
            background: active ? "rgba(31,36,26,0.60)" : "rgba(31,36,26,0.45)",
          }}
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

function ymdFromDateUTC(d: Date) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

type CalendarAPI = {
  ok: boolean;
  tz: string;
  gregorian?: { ymd: string; asOfLocal: string };
  solar?: {
    kind?: "PHASE" | "INTERPHASE";
    phase?: number;
    dayInPhase?: number;
    interphaseDay?: number;
    interphaseTotal?: number;
  };
  astro?: {
    sunPos?: string; // ex: "19° Cap 14'"
  };
};

async function fetchCalendarForProfile(asOfISO?: string | null) {
  // ✅ Next.js 16: headers() is async (Promise<ReadonlyHeaders>)
  const h = await headers();

  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  if (!host) return null;

  const base = `${proto}://${host}`;

  // If profile has an asOfDate, pin calendar to that day (ymd). Otherwise, calendar "today".
  let url = `${base}/api/calendar`;
  if (asOfISO) {
    const d = new Date(asOfISO);
    if (!Number.isNaN(d.getTime())) {
      const ymd = ymdFromDateUTC(d);
      url = `${base}/api/calendar?ymd=${encodeURIComponent(ymd)}`;
    }
  }

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const json = (await res.json()) as CalendarAPI;
    if (!json?.ok) return null;
    return json;
  } catch {
    return null;
  }
}

export default async function ProfilePage() {
  const user = await requireUser();
  const profile = await ensureProfileCaches(user.id);

  // Calendar background (parity)
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
          {/* Header */}
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-baseline justify-between md:block">
              <div
                className="text-xs tracking-[0.28em] uppercase"
                style={{ color: "rgba(31,36,26,0.55)" }}
              >
                URA
              </div>
              <div
                className="mt-1 text-lg font-semibold tracking-tight"
                style={{ color: "rgba(31,36,26,0.90)" }}
              >
                Profile
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {NAV.map((n) => (
                <NavPill
                  key={n.href}
                  href={n.href}
                  label={n.label}
                  active={n.href === "/profile"}
                />
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
            <div
              className="mt-2 text-2xl font-semibold tracking-tight"
              style={{ color: "rgba(31,36,26,0.92)" }}
            >
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

  // ✅ Calendar parity payload (server-side)
  const cal = await fetchCalendarForProfile(asOfISO);

  const solarPhaseId =
    typeof cal?.solar?.phase === "number" && cal.solar.phase >= 1 && cal.solar.phase <= 8
      ? cal.solar.phase
      : null;

  const solarProgress01 =
    cal?.solar?.kind === "INTERPHASE"
      ? typeof cal?.solar?.interphaseDay === "number" &&
        typeof cal?.solar?.interphaseTotal === "number" &&
        cal.solar.interphaseTotal > 0
        ? cal.solar.interphaseDay / cal.solar.interphaseTotal
        : null
      : typeof cal?.solar?.dayInPhase === "number"
      ? (cal.solar.dayInPhase - 1) / 45
      : null;

  const sunText = cal?.astro?.sunPos ?? null;
  const asOfLabel = cal?.gregorian?.asOfLocal ?? null;

  return (
    <div className="min-h-screen px-4 py-8" style={{ background: pageBg }}>
      <div className="mx-auto w-full max-w-5xl">
        {/* Header (Calendar parity) */}
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-baseline justify-between md:block">
            <div
              className="text-xs tracking-[0.28em] uppercase"
              style={{ color: "rgba(31,36,26,0.55)" }}
            >
              URA
            </div>
            <div
              className="mt-1 text-lg font-semibold tracking-tight"
              style={{ color: "rgba(31,36,26,0.90)" }}
            >
              Profile
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {NAV.map((n) => (
              <NavPill
                key={n.href}
                href={n.href}
                label={n.label}
                active={n.href === "/profile"}
              />
            ))}

            <Link href="/profile/setup" aria-label="Edit profile">
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
          movingSunLon={movingSunLon}
          movingMoonLon={movingMoonLon}
          cyclePosDeg={cyclePos}
          // ✅ Calendar parity props
          solarPhaseId={solarPhaseId}
          solarProgress01={solarProgress01}
          sunText={sunText}
          asOfLabel={asOfLabel}
        />
      </div>
    </div>
  );
}
