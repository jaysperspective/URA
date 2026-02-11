import fs from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";

/**
 * Permanently deletes a user and all associated data.
 * Used by both self-service account deletion and admin deletion.
 */
export async function deleteUserById(userId: number): Promise<{ ok: true }> {
  // 1. Fetch profile to get avatar path (before cascading delete removes it)
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { avatarUrl: true },
  });

  // 2. Delete DailyBriefCache records (no cascade relation)
  await prisma.dailyBriefCache.deleteMany({ where: { userId } });

  // 3. Delete HdReadCache records (no cascade relation)
  await prisma.hdReadCache.deleteMany({ where: { userId } });

  // 4. Delete avatar file if it exists
  if (profile?.avatarUrl) {
    try {
      const filePath = path.join(process.cwd(), "public", profile.avatarUrl);
      await fs.unlink(filePath);
    } catch {
      // File may already be gone — ignore
    }
  }

  // 5. Delete the User record
  //    Cascades: Profile, Sessions, FeatureFlagOverrides
  //    Events: userId set to null (onDelete: SetNull)
  await prisma.user.delete({ where: { id: userId } });

  return { ok: true };
}
