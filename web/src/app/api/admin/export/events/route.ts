import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminUnlocked } from "@/lib/adminGate";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const okAdmin = await isAdminUnlocked();
  if (!okAdmin) return NextResponse.json({ ok: false }, { status: 401 });

  const url = new URL(req.url);
  const days = Math.min(90, Math.max(1, Number(url.searchParams.get("days") || 14)));
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const events = await prisma.event.findMany({
    where: { createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
    take: 20000, // cap
  });

  return new NextResponse(JSON.stringify({ exportedAt: new Date().toISOString(), since: since.toISOString(), events }), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="ura-events-${days}d.json"`,
    },
  });
}
