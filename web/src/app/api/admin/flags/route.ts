import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminUnlocked } from "@/lib/adminGate";
import { auditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET() {
  const okAdmin = await isAdminUnlocked();
  if (!okAdmin) return NextResponse.json({ ok: false }, { status: 401 });

  const flags = await prisma.featureFlag.findMany({
    orderBy: { key: "asc" },
    select: { id: true, key: true, description: true, enabled: true, payload: true, updatedAt: true },
  });

  return NextResponse.json({ ok: true, flags });
}

export async function POST(req: Request) {
  const okAdmin = await isAdminUnlocked();
  if (!okAdmin) return NextResponse.json({ ok: false }, { status: 401 });

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const key = typeof body?.key === "string" ? body.key.trim() : "";
  if (!key) return NextResponse.json({ ok: false, error: "Missing key" }, { status: 400 });

  const enabled = Boolean(body?.enabled);
  const description = typeof body?.description === "string" ? body.description.trim().slice(0, 240) : null;
  const payload = body?.payload ?? undefined;

  const flag = await prisma.featureFlag.upsert({
    where: { key },
    create: { key, enabled, description: description ?? undefined, payload },
    update: { enabled, description: description ?? undefined, payload },
    select: { id: true, key: true, enabled: true, description: true, payload: true, updatedAt: true },
  });

  await auditLog({ action: "flag.upsert", meta: { key, enabled } });

  return NextResponse.json({ ok: true, flag });
}
