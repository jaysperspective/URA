// src/lib/audit.ts
import { prisma } from "@/lib/prisma";

export async function auditLog(params: {
  action: string;
  actor?: string;
  ip?: string | null;
  meta?: any;
}) {
  const { action, actor = "admin", ip = null, meta = undefined } = params;

  try {
    await prisma.adminAuditLog.create({
      data: {
        action,
        actor,
        ip: ip ?? null,
        meta: meta ?? undefined,
      },
    });
  } catch {
    // never block app behavior on logging
  }
}
