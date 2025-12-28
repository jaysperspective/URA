// src/app/api/me/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const jar = await cookies();
  const raw = jar.get("ura_session")?.value ?? null;

  const user = await getCurrentUser();

  return NextResponse.json({
    ok: true,
    hasCookie: !!raw,
    cookiePrefix: raw ? raw.slice(0, 8) : null,
    authed: !!user,
    userId: user?.id ?? null,
    email: user?.email ?? null,
    setupDone: user?.profile?.setupDone ?? null,
  });
}
