// src/app/profile/edit/page.tsx
import Link from "next/link";
import { requireUser } from "@/lib/auth/requireUser";
import { ensureProfileCaches } from "@/lib/profile/ensureProfileCaches";
import EditProfileClient from "./ui/EditProfileClient";

export default async function EditProfilePage() {
  const user = await requireUser();
  const profile = await ensureProfileCaches(user.id);

  const pageBg =
    "radial-gradient(1200px 700px at 50% -10%, rgba(244,235,221,0.55), rgba(255,255,255,0) 60%), linear-gradient(180deg, rgba(245,240,232,0.70), rgba(245,240,232,0.92))";

  if (!profile) {
    return (
      <div className="min-h-screen px-4 py-8" style={{ background: pageBg }}>
        <div className="mx-auto w-full max-w-3xl">
          <div className="rounded-3xl border border-black/10 bg-white/60 p-6">
            <div className="text-sm text-black/70">No profile found.</div>
            <div className="mt-4">
              <Link href="/profile" className="underline text-black/80">
                Back to Profile
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Prefill values — use whatever your profile currently stores
  const initial = {
    username: profile.username ?? "",
    timezone: profile.timezone ?? "America/New_York",
    city: profile.city ?? "",
    state: profile.state ?? "",
    lat: typeof (profile as any).lat === "number" ? (profile as any).lat : null,
    lon: typeof (profile as any).lon === "number" ? (profile as any).lon : null,

    // Birth pieces (adjust if your schema uses different fields)
    birthYear: (profile as any).birthYear ?? null,
    birthMonth: (profile as any).birthMonth ?? null,
    birthDay: (profile as any).birthDay ?? null,
    birthHour: (profile as any).birthHour ?? null,
    birthMinute: (profile as any).birthMinute ?? null,

    // Photo URL (if you store it)
    imageUrl: (profile as any).imageUrl ?? null,
  };

  return (
    <div className="min-h-screen px-4 py-8" style={{ background: pageBg }}>
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <div className="text-xs tracking-[0.28em] uppercase text-black/50">URA</div>
            <div className="mt-1 text-lg font-semibold tracking-tight text-black/90">
              Edit Profile
            </div>
            <div className="mt-1 text-sm text-black/60">
              Update identity + birth inputs. We’ll refresh the cycle calculations.
            </div>
          </div>

          <Link
            href="/profile"
            className="rounded-full border border-black/15 bg-white/60 px-4 py-2 text-sm text-black/80 hover:bg-white/80"
          >
            Back
          </Link>
        </div>

        <EditProfileClient initial={initial} />
      </div>
    </div>
  );
}
