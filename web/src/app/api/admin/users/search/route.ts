import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminUnlocked } from "@/lib/adminGate";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const okAdmin = await isAdminUnlocked();
  if (!okAdmin) return NextResponse.json({ ok: false }, { status: 401 });

  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").trim();
  const take = Math.min(50, Math.max(5, Number(url.searchParams.get("take") || 25)));

  const where =
    q.length === 0
      ? {}
      : {
          OR: [
            { email: { contains: q, mode: "insensitive" as const } },
            { displayName: { contains: q, mode: "insensitive" as const } },
            { profile: { username: { contains: q, mode: "insensitive" as const } } },
          ],
        };

  const users = await prisma.user.findMany({
    where,
    orderBy: [{ lastSeenAt: "desc" }, { createdAt: "desc" }],
    take,
    select: {
      id: true,
      email: true,
      displayName: true,
      status: true,
      createdAt: true,
      lastSeenAt: true,
      profile: { select: { username: true, setupDone: true, birthPlace: true, timezone: true } },
    },
  });

  return NextResponse.json({ ok: true, users });
}
