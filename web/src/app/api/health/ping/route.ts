import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminUnlocked } from "@/lib/adminGate";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const okAdmin = await isAdminUnlocked();
  if (!okAdmin) return NextResponse.json({ ok: false }, { status: 401 });

  let body: any = {};
  try {
    body = await req.json();
  } catch {}

  const serviceKey = typeof body?.serviceKey === "string" ? body.serviceKey.slice(0, 40) : "app";
  const start = Date.now();

  // Minimal: DB ping is always available
  let ok = true;
  let details: any = {};

  try {
    await prisma.$queryRaw`SELECT 1`;
    details.db = "ok";
  } catch (e: any) {
    ok = false;
    details.db = "fail";
    details.error = String(e?.message ?? e);
  }

  const latencyMs = Date.now() - start;

  await prisma.healthCheck.create({
    data: {
      serviceKey,
      ok,
      latencyMs,
      details,
    },
  });

  return NextResponse.json({ ok, serviceKey, latencyMs, details });
}
