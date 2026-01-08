// src/app/logout/route.ts
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);

  // Redirect to a valid page on the SAME origin (no hardcoded localhost)
  const res = NextResponse.redirect(new URL("/", url), { status: 302 });

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

  // Expire cookies across common paths (covers most ways they might have been set)
  const PATHS = ["/", "/profile", "/logout", "/chart", "/seasons", "/moon", "/lunation"];

  for (const name of CANDIDATES) {
    for (const path of PATHS) {
      res.cookies.set(name, "", { path, expires: new Date(0) });
    }
  }

  return res;
}
