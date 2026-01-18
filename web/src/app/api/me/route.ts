// src/app/api/me/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { withStandardRateLimit } from "@/lib/withRateLimit";

async function handleGet() {
  const user = await getCurrentUser();

  // SECURITY: Do not expose any part of session tokens in responses
  return NextResponse.json({
    ok: true,
    authed: !!user,
    userId: user?.id ?? null,
    email: user?.email ?? null,
    setupDone: user?.profile?.setupDone ?? null,
  });
}

export const GET = withStandardRateLimit(handleGet as any);
