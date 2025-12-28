import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/requireUser";
import { prisma } from "@/lib/prisma";
import SetupForm from "./SetupForm";

export default async function ProfileSetupPage() {
  const user = await requireUser();
  if (!user) redirect("/login");

  const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
  if (profile?.setupDone) redirect("/profile");

  return (
    <div className="min-h-screen bg-black text-neutral-100">
      <div className="mx-auto max-w-2xl px-6 py-10">
        <header className="mb-8">
          <div className="text-sm text-neutral-400">Profile setup</div>
          <h1 className="text-3xl font-semibold tracking-tight">Save your birth data</h1>
          <div className="mt-2 text-sm text-neutral-400">
            Once saved, your Profile keeps Asc Year + Lunation updated automatically.
          </div>
        </header>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <SetupForm />
        </div>
      </div>
    </div>
  );
}
