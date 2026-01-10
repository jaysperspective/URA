import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserIdFromRequest } from "@/lib/auth"; 
// ^ you’ll implement this based on how you read your Session token (cookie/header)

const MIN_UPDATE_MS = 0; // 15 minutes

export async function POST(req: Request) {
  const userId = await getSessionUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ ok: false }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { lastSeenAt: true },
  });

  const now = new Date();
  const shouldUpdate =
    !user?.lastSeenAt || now.getTime() - user.lastSeenAt.getTime() > MIN_UPDATE_MS;

  if (shouldUpdate) {
    await prisma.user.update({
      where: { id: userId },
      data: { lastSeenAt: now },
    });
  }

  return NextResponse.json({ ok: true, updated: shouldUpdate });
}
