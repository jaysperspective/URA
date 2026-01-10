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

  const userId = Number(body?.userId);
  const status = typeof body?.status === "string" ? body.status.trim() : "";

  if (!Number.isFinite(userId) || !status) {
    return NextResponse.json({ ok: false, error: "Missing userId/status" }, { status: 400 });
  }

  // must match Prisma enum strings
  if (!["ACTIVE", "DISABLED", "BANNED"].includes(status)) {
    return NextResponse.json({ ok: false, error: "Invalid status" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { status },
    select: { id: true, email: true, status: true },
  });

  await auditLog({ action: "user.status", meta: { userId, status } });

  return NextResponse.json({ ok: true, user });
}
