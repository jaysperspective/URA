// src/app/profile/page.tsx
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/requireUser";
import { prisma } from "@/lib/prisma";
import { ensureProfileCaches } from "@/lib/profile/ensureProfileCaches";
import ProfileClient from "./ui/ProfileClient";

export default async function ProfilePage() {
  const user = await requireUser();
  if (!user) redirect("/login");

  // Ensure natal + daily caches are present
  await ensureProfileCaches(user.id);

  const profile = await prisma.profile.findUnique({
    where: { userId: user.id },
  });

  if (!profile) redirect("/profile/setup");
  if (!profile.setupDone) redirect("/profile/setup");

  // Birth data guard
  const hasBirth =
    typeof profile.birthYear === "number" &&
    typeof profile.birthMonth === "number" &&
    typeof profile.birthDay === "number" &&
    typeof profile.birthHour === "number" &&
    typeof profile.birthMinute === "number" &&
    typeof profile.birthLat === "number" &&
    typeof profile.birthLon === "number";

  if (!hasBirth) redirect("/profile/setup");

  const natal = profile.natalChartJson ?? null;
  const asc = profile.ascYearJson ?? null;
  const luna = profile.lunationJson ?? null;

  return (
    <ProfileClient
      username={profile.username || user.email || "Profile"}
      timezone={profile.timezone || "America/New_York"}
      asOfDate={profile.asOfDate ? profile.asOfDate.toISOString() : null}
      natalJson={natal as any}
      ascYearJson={asc as any}
      lunationJson={luna as any}
    />
  );
}
