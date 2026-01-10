import { prisma } from "@/lib/prisma";

export type AdminMetrics = {
  // users
  totalUsers: number;
  dau: number;
  wau: number;
  mau: number;

  newUsers7d: number;
  newUsers30d: number;
  lastSignupAt: string | null;

  activationRate01: number; // 0..1
  setupDoneCount: number;

  churn: {
    inactive7d: number;
    inactive14d: number;
    inactive30d: number;
    inactive45d: number;
  };

  // telemetry rollups
  topPages: Array<{ path: string; count: number }>;
  topFeatures: Array<{ name: string; count: number }>;
  topErrors: Array<{ key: string; count: number }>;
  slowEndpoints: Array<{ name: string; avgMs: number; p95Ms: number; n: number }>;

  // health
  healthLatest: Array<{ serviceKey: string; ok: boolean; latencyMs: number | null; checkedAt: string }>;

  // flags
  flags: Array<{ key: string; enabled: boolean; updatedAt: string }>;

  // audit
  recentAudit: Array<{ id: number; action: string; actor: string; createdAt: string }>;
};

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.floor(p * (sorted.length - 1))));
  return sorted[idx] ?? 0;
}

export async function getAdminMetrics(): Promise<AdminMetrics> {
  const now = new Date();
  const hours24 = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const days7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const days14 = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const days30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const days45 = new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    dau,
    wau,
    mau,
    newUsers7d,
    newUsers30d,
    lastUser,
    setupDoneCount,

    inactive7d,
    inactive14d,
    inactive30d,
    inactive45d,

    // top pages/features/errors
    topPageRows,
    topFeatureRows,
    topErrorRows,

    // timing rows for p95
    slowTimingRows,

    // health + flags + audit
    healthRows,
    flagRows,
    auditRows,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { lastSeenAt: { gte: hours24 } } }),
    prisma.user.count({ where: { lastSeenAt: { gte: days7 } } }),
    prisma.user.count({ where: { lastSeenAt: { gte: days30 } } }),
    prisma.user.count({ where: { createdAt: { gte: days7 } } }),
    prisma.user.count({ where: { createdAt: { gte: days30 } } }),
    prisma.user.findFirst({ orderBy: { createdAt: "desc" }, select: { createdAt: true } }),
    prisma.profile.count({ where: { setupDone: true } }),

    prisma.user.count({ where: { OR: [{ lastSeenAt: null }, { lastSeenAt: { lt: days7 } }] } }),
    prisma.user.count({ where: { OR: [{ lastSeenAt: null }, { lastSeenAt: { lt: days14 } }] } }),
    prisma.user.count({ where: { OR: [{ lastSeenAt: null }, { lastSeenAt: { lt: days30 } }] } }),
    prisma.user.count({ where: { OR: [{ lastSeenAt: null }, { lastSeenAt: { lt: days45 } }] } }),

    prisma.event.groupBy({
      by: ["path"],
      where: { type: "pageview", path: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { _all: "desc" } },
      take: 12,
    }),

    prisma.event.groupBy({
      by: ["name"],
      where: { type: "feature", name: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { _all: "desc" } },
      take: 12,
    }),

    prisma.event.groupBy({
      by: ["name", "path"],
      where: { type: "error" },
      _count: { _all: true },
      orderBy: { _count: { _all: "desc" } },
      take: 12,
    }),

    prisma.event.findMany({
      where: { type: "timing", durationMs: { not: null }, name: { not: null } },
      orderBy: { createdAt: "desc" },
      take: 2000,
      select: { name: true, durationMs: true },
    }),

    prisma.healthCheck.findMany({
      orderBy: { checkedAt: "desc" },
      take: 50,
      select: { serviceKey: true, ok: true, latencyMs: true, checkedAt: true },
    }),

    prisma.featureFlag.findMany({
      orderBy: { key: "asc" },
      select: { key: true, enabled: true, updatedAt: true },
    }),

    prisma.adminAuditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, action: true, actor: true, createdAt: true },
    }),
  ]);

  // activation rate: setupDone / totalUsers (safe)
  const activationRate01 = totalUsers > 0 ? setupDoneCount / totalUsers : 0;

  // roll up top lists
  const topPages = (topPageRows || [])
    .filter((r) => r.path)
    .map((r) => ({ path: r.path as string, count: r._count._all }));

  const topFeatures = (topFeatureRows || [])
    .filter((r) => r.name)
    .map((r) => ({ name: r.name as string, count: r._count._all }));

  const topErrors = (topErrorRows || []).map((r) => {
    const key = (r.name || r.path || "unknown") as string;
    return { key, count: r._count._all };
  });

  // slow endpoints: compute avg + p95 per name from sample
  const map: Record<string, number[]> = {};
  for (const row of slowTimingRows) {
    const name = row.name || "unknown";
    const ms = row.durationMs ?? 0;
    if (!map[name]) map[name] = [];
    map[name].push(ms);
  }

  const slowEndpoints = Object.entries(map)
    .map(([name, arr]) => {
      const sorted = arr.slice().sort((a, b) => a - b);
      const avg = Math.round(sorted.reduce((a, b) => a + b, 0) / Math.max(1, sorted.length));
      const p95 = Math.round(percentile(sorted, 0.95));
      return { name, avgMs: avg, p95Ms: p95, n: sorted.length };
    })
    .sort((a, b) => b.p95Ms - a.p95Ms)
    .slice(0, 10);

  // latest health per serviceKey
  const seen = new Set<string>();
  const healthLatest: Array<{ serviceKey: string; ok: boolean; latencyMs: number | null; checkedAt: string }> = [];
  for (const h of healthRows) {
    if (seen.has(h.serviceKey)) continue;
    seen.add(h.serviceKey);
    healthLatest.push({
      serviceKey: h.serviceKey,
      ok: h.ok,
      latencyMs: h.latencyMs ?? null,
      checkedAt: h.checkedAt.toISOString(),
    });
    if (healthLatest.length >= 8) break;
  }

  const flags = flagRows.map((f) => ({ key: f.key, enabled: f.enabled, updatedAt: f.updatedAt.toISOString() }));

  return {
    totalUsers,
    dau,
    wau,
    mau,
    newUsers7d,
    newUsers30d,
    lastSignupAt: lastUser?.createdAt ? lastUser.createdAt.toISOString() : null,

    activationRate01,
    setupDoneCount,

    churn: { inactive7d, inactive14d, inactive30d, inactive45d },

    topPages,
    topFeatures,
    topErrors,
    slowEndpoints,

    healthLatest,
    flags,

    recentAudit: auditRows.map((r) => ({
      id: r.id,
      action: r.action,
      actor: r.actor,
      createdAt: r.createdAt.toISOString(),
    })),
  };
}
