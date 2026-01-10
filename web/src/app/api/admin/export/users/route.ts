import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminUnlocked } from "@/lib/adminGate";

export const dynamic = "force-dynamic";

export async function GET() {
  const okAdmin = await isAdminUnlocked();
  if (!okAdmin) return NextResponse.json({ ok: false }, { status: 401 });

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      displayName: true,
      status: true,
      createdAt: true,
      lastSeenAt: true,
      profile: true,
    },
  });

  return new NextResponse(JSON.stringify({ exportedAt: new Date().toISOString(), users }), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="ura-users-export.json"`,
    },
  });
}
