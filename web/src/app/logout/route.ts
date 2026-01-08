// src/app/logout/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  // Relative redirect (prevents localhost/host header issues)
  const res = NextResponse.redirect("/", { status: 302 });

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

  const PATHS = ["/", "/profile", "/logout", "/chart", "/seasons", "/moon", "/lunation"];

  for (const name of CANDIDATES) {
    for (const path of PATHS) {
      res.cookies.set(name, "", { path, expires: new Date(0) });
    }
  }

  return res;
}
