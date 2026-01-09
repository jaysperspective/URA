import { prisma } from "@/lib/prisma";

export type AdminMetrics = {
  totalUsers: number;
  active7d: number;
  newUsers30d: number;
  lastSignupAt: string | null;
};

export async function getAdminMetrics(): Promise<AdminMetrics> {
  // Assumptions:
  // - You have a User model in Prisma
  // - User has createdAt (DateTime)
  // - User has lastSeenAt (DateTime, nullable) for “active” calculations
  const now = new Date();
  const days7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const days30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [totalUsers, active7d, newUsers30d, lastUser] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { lastSeenAt: { gte: days7 } } }),
    prisma.user.count({ where: { createdAt: { gte: days30 } } }),
    prisma.user.findFirst({ orderBy: { createdAt: "desc" }, select: { createdAt: true } }),
  ]);

  return {
    totalUsers,
    active7d,
    newUsers30d,
    lastSignupAt: lastUser?.createdAt ? lastUser.createdAt.toISOString() : null,
  };
}
