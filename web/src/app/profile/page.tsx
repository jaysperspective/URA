import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.profile?.setupDone) redirect("/profile/setup");

  return (
    <div className="min-h-screen bg-[#333131] text-neutral-100 flex items-center justify-center px-4">
      <div className="w-full max-w-2xl border border-white/10 bg-black/20 backdrop-blur rounded-2xl p-6 shadow">
        <h1 className="text-xl font-semibold">
          {user.displayName || user.profile?.username || "Profile"}
        </h1>
        <p className="text-sm text-neutral-300 mt-1">@{user.profile?.username}</p>

        <div className="mt-4 text-sm text-neutral-300">
          {(user.profile?.city || user.profile?.state)
            ? `${user.profile?.city ?? ""}${user.profile?.city && user.profile?.state ? ", " : ""}${user.profile?.state ?? ""}`
            : "Location not set"}
        </div>

        <div className="mt-5">
          {user.profile?.bio ? (
            <p className="text-sm text-neutral-200 leading-relaxed">{user.profile.bio}</p>
          ) : (
            <p className="text-sm text-neutral-400">No bio yet.</p>
          )}
        </div>

        <div className="mt-6 flex gap-3">
          <Link href="/chart" className="rounded-xl bg-white text-black px-4 py-2 font-medium hover:opacity-90">
            Go to Chart
          </Link>
          <Link href="/" className="rounded-xl border border-white/15 px-4 py-2 hover:bg-white/5">
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
