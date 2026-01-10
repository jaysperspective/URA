import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminUnlocked } from "@/lib/adminGate";
import { auditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const okAdmin = await isAdminUnlocked();
  if (!okAdmin) return NextResponse.json({ ok: false }, { status: 401 });

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const flagKey = typeof body?.flagKey === "string" ? body.flagKey.trim() : "";
  const userId = Number(body?.userId);
  const enabled = Boolean(body?.enabled);
  const payload = body?.payload ?? undefined;

  if (!flagKey || !Number.isFinite(userId)) {
    return NextResponse.json({ ok: false, error: "Missing flagKey or userId" }, { status: 400 });
  }

  const flag = await prisma.featureFlag.findUnique({
    where: { key: flagKey },
    select: { id: true, key: true },
  });

  if (!flag) return NextResponse.json({ ok: false, error: "Flag not found" }, { status: 404 });

  const ov = await prisma.featureFlagOverride.upsert({
    where: { flagId_userId: { flagId: flag.id, userId } },
    create: { flagId: flag.id, userId, enabled, payload },
    update: { enabled, payload },
    select: { id: true, enabled: true, payload: true },
  });

  await auditLog({ action: "flag.override", meta: { flagKey, userId, enabled } });

  return NextResponse.json({ ok: true, override: ov });
}
