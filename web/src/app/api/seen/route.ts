// src/app/api/seen/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserIdFromRequest } from "@/lib/auth";
import { withStandardRateLimit } from "@/lib/withRateLimit";

export const dynamic = "force-dynamic";

/**
 * Throttle how often we write lastSeenAt for a given user.
 * This keeps DB writes cheap while still letting you compute DAU/WAU/MAU.
 *
 * If you want more frequent updates, drop this to 1–5 minutes.
 */
const MIN_UPDATE_MS = 0; // 15 minutes

function dayKeyInTZ(d: Date, tz: string) {
  // "en-CA" reliably yields YYYY-MM-DD ordering via parts.
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);

  const y = parts.find((p) => p.type === "year")?.value ?? "0000";
  const m = parts.find((p) => p.type === "month")?.value ?? "00";
  const day = parts.find((p) => p.type === "day")?.value ?? "00";
  return `${y}-${m}-${day}`;
}

async function handlePost(req: NextRequest) {
  // Only logged-in users update lastSeen.
  const userId = await getSessionUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ ok: true, skipped: "no-session" });

  const now = new Date();

  // Pull what we need in one read: lastSeenAt + timezone (if available)
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      lastSeenAt: true,
      profile: { select: { timezone: true } },
    },
  });

  if (!user) return NextResponse.json({ ok: true, skipped: "no-user" });

  // Throttle writes
  if (user.lastSeenAt) {
    const delta = now.getTime() - user.lastSeenAt.getTime();
    if (delta < MIN_UPDATE_MS) {
      return NextResponse.json({ ok: true, throttled: true });
    }
  }

  const tz = user.profile?.timezone || "America/New_York";
  const lastSeenDayKey = dayKeyInTZ(now, tz);

  await prisma.user.update({
    where: { id: userId },
    data: {
      lastSeenAt: now,
      lastSeenDayKey,
    },
  });

  return NextResponse.json({ ok: true, updated: true, lastSeenDayKey });
}

export const POST = withStandardRateLimit(handlePost);
