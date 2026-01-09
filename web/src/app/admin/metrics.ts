import { prisma } from "@/lib/prisma";

export type AdminMetrics = {
  totalUsers: number;

  // activity
  dau: number; // last 24h
  wau: number; // last 7d
  mau: number; // last 30d

  // growth
  newUsers7d: number;
  newUsers30d: number;
  lastSignupAt: string | null;

  // audit
  recentAudit: Array<{
    id: number;
    action: string;
    actor: string;
    createdAt: string;
  }>;
};

export async function getAdminMetrics(): Promise<AdminMetrics> {
  const now = new Date();
  const hours24 = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const days7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const days30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,

    dau,
    wau,
    mau,

    newUsers7d,
    newUsers30d,

    lastUser,
    auditRows,
  ] = await Promise.all([
    prisma.user.count(),

    prisma.user.count({ where: { lastSeenAt: { gte: hours24 } } }),
    prisma.user.count({ where: { lastSeenAt: { gte: days7 } } }),
    prisma.user.count({ where: { lastSeenAt: { gte: days30 } } }),

    prisma.user.count({ where: { createdAt: { gte: days7 } } }),
    prisma.user.count({ where: { createdAt: { gte: days30 } } }),

    prisma.user.findFirst({ orderBy: { createdAt: "desc" }, select: { createdAt: true } }),

    prisma.adminAuditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 12,
      select: { id: true, action: true, actor: true, createdAt: true },
    }),
  ]);

  return {
    totalUsers,

    dau,
    wau,
    mau,

    newUsers7d,
    newUsers30d,
    lastSignupAt: lastUser?.createdAt ? lastUser.createdAt.toISOString() : null,

    recentAudit: auditRows.map((r) => ({
      id: r.id,
      action: r.action,
      actor: r.actor,
      createdAt: r.createdAt.toISOString(),
    })),
  };
}
