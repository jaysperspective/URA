// src/app/profile/edit/page.tsx
import Link from "next/link";
import { requireUser } from "@/lib/auth/requireUser";
import { ensureProfileCaches } from "@/lib/profile/ensureProfileCaches";
import EditProfileClient from "./ui/EditProfileClient";
import AppNav from "@/components/AppNav";

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

export default async function EditProfilePage() {
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

  const locationLine =
    profile.birthPlace?.trim() ||
    [profile.city, profile.state].filter(Boolean).join(", ") ||
    profile.timezone ||
    "America/New_York";

  return (
    <div className="min-h-screen px-4 py-8" style={{ background: pageBg }}>
      <div className="mx-auto w-full max-w-5xl">
        {/* Header + Nav */}
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
            {/* ✅ unified nav */}
            <AppNav activePathOverride="/profile" />

            <Link href="/profile" aria-label="Back to profile">
              <ActionPill>Back</ActionPill>
            </Link>
          </div>
        </div>

        <EditProfileClient
          initial={{
            username: profile.username ?? "",
            bio: profile.bio ?? "",
            timezone: profile.timezone ?? "America/New_York",

            city: profile.city ?? "",
            state: profile.state ?? "",

            birthPlace: profile.birthPlace ?? locationLine,
            locationLine,

            lat: profile.birthLat ?? null,
            lon: profile.birthLon ?? null,

            birthYear: profile.birthYear ?? null,
            birthMonth: profile.birthMonth ?? null,
            birthDay: profile.birthDay ?? null,
            birthHour: profile.birthHour ?? null,
            birthMinute: profile.birthMinute ?? null,

            avatarUrl: profile.avatarUrl ?? null,
          }}
        />
      </div>
    </div>
  );
}
