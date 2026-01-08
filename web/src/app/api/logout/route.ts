// src/app/api/logout/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  const res = NextResponse.json({ ok: true }, { status: 200 });

  const CANDIDATES = [
    "ura_session",
    "session",
    "sessionId",
    "sid",
    "token",
    "auth",
    "auth_token",
    "next-auth.session-token",
    "__Secure-next-auth.session-token",
  ];

  // Try expiring across likely paths
  const PATHS = ["/", "/profile", "/logout", "/api", "/chart", "/seasons", "/moon", "/lunation"];

  for (const name of CANDIDATES) {
    for (const path of PATHS) {
      res.cookies.set(name, "", { path, expires: new Date(0) });
    }
  }

  return res;
}
