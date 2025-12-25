// /src/app/profile/setup/page.tsx
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { saveProfileSetup } from "./actions";

export default async function ProfileSetupPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.profile?.setupDone) redirect("/profile");

  return (
    <div className="min-h-screen bg-[#333131] text-neutral-100 flex items-center justify-center px-4">
      <div className="w-full max-w-xl border border-white/10 bg-black/20 backdrop-blur rounded-2xl p-6 shadow">
        <h1 className="text-xl font-semibold">Profile setup</h1>
        <p className="text-sm text-neutral-300 mt-1">Set your identity inside URA.</p>

        <form action={saveProfileSetup} className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="text-xs text-neutral-300">Username</label>
            <input
              name="username"
              required
              className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 outline-none focus:border-white/30"
              placeholder="jaysperspective"
              autoComplete="username"
            />
          </div>

          <div>
            <label className="text-xs text-neutral-300">City</label>
            <input
              name="city"
              className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 outline-none focus:border-white/30"
              placeholder="Detroit"
            />
          </div>

          <div>
            <label className="text-xs text-neutral-300">State</label>
            <input
              name="state"
              maxLength={2}
              className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 outline-none focus:border-white/30"
              placeholder="MI"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-xs text-neutral-300">Bio</label>
            <textarea
              name="bio"
              rows={4}
              className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 outline-none focus:border-white/30"
              placeholder="Photographer. Builder. Here to map the seasons."
            />
          </div>

          <div className="md:col-span-2 flex justify-end">
            <button className="rounded-xl bg-white text-black px-4 py-2 font-medium hover:opacity-90">
              Save & continue
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
