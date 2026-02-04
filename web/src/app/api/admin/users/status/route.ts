import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminUnlocked } from "@/lib/adminGate";
import { auditLog } from "@/lib/audit";
import { userStatusInputSchema, type UserStatusInput } from "@/lib/schemas/admin";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const okAdmin = await isAdminUnlocked();
  if (!okAdmin) return NextResponse.json({ ok: false }, { status: 401 });

  let rawBody: unknown = null;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const parseResult = userStatusInputSchema.safeParse(rawBody);
  if (!parseResult.success) {
    const errors = parseResult.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    return NextResponse.json({ ok: false, error: errors }, { status: 400 });
  }

  const body: UserStatusInput = parseResult.data;
  const userId = body.userId;
  const status = body.status;

  const user = await prisma.user.update({
    where: { id: userId },
    data: { status },
    select: { id: true, email: true, status: true },
  });

  await auditLog({ action: "user.status", meta: { userId, status } });

  return NextResponse.json({ ok: true, user });
}
