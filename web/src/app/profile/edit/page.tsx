// src/app/profile/edit/page.tsx
import Link from "next/link";
import { requireUser } from "@/lib/auth/requireUser";
import { ensureProfileCaches } from "@/lib/profile/ensureProfileCaches";
import EditProfileClient from "./ui/EditProfileClient";

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

export default async function ProfileEditPage({
  searchParams,
}: {
  searchParams?: { error?: string };
}) {
  const user = await requireUser();
  const profile = await ensureProfileCaches(user.id);

  const pageBg =
    "radial-gradient(1200px 700px at 50% -10%, rgba(244,235,221,0.55), rgba(255,255,255,0) 60%), linear-gradient(180deg, rgba(245,240,232,0.70), rgba(245,240,232,0.92))";

  if (!profile) {
    return (
      <div className="min-h-screen px-4 py-8" style={{ background: pageBg }}>
        <div className="mx-auto w-full max-w-3xl">
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
            <div className="mt-5">
              <Link href="/calendar">
                <ActionPill>Back to Calendar</ActionPill>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const tz = profile.timezone ?? "America/New_York";
  const locationLine = [profile.city, profile.state].filter(Boolean).join(", ") || tz;

  const err = searchParams?.error ? decodeURIComponent(String(searchParams.error)) : null;

  return (
    <div className="min-h-screen px-4 py-8" style={{ background: pageBg }}>
      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-baseline justify-between md:block">
            <div className="text-xs tracking-[0.28em] uppercase" style={{ color: "rgba(31,36,26,0.55)" }}>
              URA
            </div>
            <div className="mt-1 text-lg font-semibold tracking-tight" style={{ color: "rgba(31,36,26,0.90)" }}>
              Edit Profile
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {NAV.map((n) => (
              <NavPill key={n.href} href={n.href} label={n.label} active={n.href === "/profile"} />
            ))}
            <Link href="/profile">
              <ActionPill>Back</ActionPill>
            </Link>
          </div>
        </div>

        {err ? (
          <div
            className="mb-4 rounded-2xl border px-5 py-3 text-sm"
            style={{
              borderColor: "rgba(120,20,20,0.25)",
              background: "rgba(255,235,235,0.65)",
              color: "rgba(120,20,20,0.85)",
            }}
          >
            {err}
          </div>
        ) : null}

        <EditProfileClient
          initial={{
            username: profile.username ?? "",
            timezone: tz,
            city: profile.city ?? "",
            state: profile.state ?? "",
            locationLine,
            lat: profile.lat ?? null,
            lon: profile.lon ?? null,

            birthYear: profile.birthYear ?? null,
            birthMonth: profile.birthMonth ?? null,
            birthDay: profile.birthDay ?? null,
            birthHour: profile.birthHour ?? null,
            birthMinute: profile.birthMinute ?? null,

            avatarUrl: (profile as any).avatarUrl ?? null,
          }}
        />
      </div>
    </div>
  );
}
