import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminUnlocked } from "@/lib/adminGate";
import { auditLog } from "@/lib/audit";
import { flagInputSchema, type FlagInput } from "@/lib/schemas/admin";

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

  let rawBody: unknown = null;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const parseResult = flagInputSchema.safeParse(rawBody);
  if (!parseResult.success) {
    const errors = parseResult.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    return NextResponse.json({ ok: false, error: errors }, { status: 400 });
  }

  const body: FlagInput = parseResult.data;
  const key = body.key;
  const enabled = body.enabled;
  const description = body.description?.slice(0, 240) ?? null;
  const payload = body.payload ?? undefined;

  const flag = await prisma.featureFlag.upsert({
    where: { key },
    create: { key, enabled, description: description ?? undefined, payload },
    update: { enabled, description: description ?? undefined, payload },
    select: { id: true, key: true, enabled: true, description: true, payload: true, updatedAt: true },
  });

  await auditLog({ action: "flag.upsert", meta: { key, enabled } });

  return NextResponse.json({ ok: true, flag });
}
