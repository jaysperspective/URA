import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminUnlocked } from "@/lib/adminGate";
import { deleteUserById } from "@/lib/account/deleteUser";
import { auditLog } from "@/lib/audit";

const bodySchema = z.object({
  userId: z.number().int().positive(),
});

export async function POST(req: Request) {
  const unlocked = await isAdminUnlocked();
  if (!unlocked) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const raw = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { userId } = parsed.data;

  try {
    await deleteUserById(userId);
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message ?? "Delete failed" },
      { status: 500 },
    );
  }

  await auditLog({ action: "user.delete", meta: { userId } });

  return NextResponse.json({ ok: true });
}
