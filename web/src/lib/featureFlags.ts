import { prisma } from "@/lib/prisma";

export async function isFeatureEnabled(flagKey: string, userId?: number | null): Promise<boolean> {
  const key = flagKey.trim();
  if (!key) return false;

  const flag = await prisma.featureFlag.findUnique({
    where: { key },
    select: { id: true, enabled: true, payload: true },
  });

  if (!flag) return false;

  // per-user override wins
  if (userId) {
    const ov = await prisma.featureFlagOverride.findUnique({
      where: { flagId_userId: { flagId: flag.id, userId } },
      select: { enabled: true },
    });
    if (ov) return ov.enabled;
  }

  return flag.enabled;
}
