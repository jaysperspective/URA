// src/app/api/logout/route.ts
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const host = req.headers.get("host") || "";
  // If host is subdomain, baseDomain becomes "airofuranus.com"
  const parts = host.split(":")[0].split(".");
  const baseDomain =
    parts.length >= 2 ? parts.slice(-2).join(".") : parts[0] || undefined;

  const res = NextResponse.json({ ok: true }, { status: 200 });

  // prevent any caching of "logged in" redirects
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.headers.set("Pragma", "no-cache");
  res.headers.set("Expires", "0");

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

  const PATHS = ["/", "/profile", "/logout", "/api", "/chart", "/seasons", "/moon", "/lunation"];

  // Try deleting with no domain, with base domain, and with dot-domain.
  const DOMAINS = Array.from(
    new Set(
      [undefined, baseDomain, baseDomain ? `.${baseDomain}` : undefined].filter(Boolean)
    )
  ) as (string | undefined)[];

  for (const name of CANDIDATES) {
    for (const path of PATHS) {
      // no domain variant
      res.cookies.set(name, "", { path, expires: new Date(0), maxAge: 0 });

      // domain variants (this is the key fix for “still logged in”)
      for (const domain of DOMAINS) {
        res.cookies.set(name, "", { path, domain, expires: new Date(0), maxAge: 0 });
      }
    }
  }

  return res;
}
