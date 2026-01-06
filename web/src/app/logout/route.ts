// src/app/logout/route.ts
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);

  // Always go back to calendar
  const res = NextResponse.redirect(new URL("/calendar", url));

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

  for (const name of CANDIDATES) {
    // expire cookies across common paths
    res.cookies.set(name, "", { path: "/", expires: new Date(0) });
    res.cookies.set(name, "", { path: "/profile", expires: new Date(0) });
  }

  return res;
}
