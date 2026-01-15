// src/app/api/logout/route.ts
import { NextResponse } from "next/server";
import { clearSession } from "@/lib/auth";
import { LOGOUT_COOKIE_NAMES, LOGOUT_COOKIE_PATHS } from "@/lib/cookies";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  // 1) Delete DB session + expire primary cookie via Next cookie jar
  await clearSession();

  const res = NextResponse.json({ ok: true }, { status: 200 });

  // 2) Prevent any caching of auth state
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.headers.set("Pragma", "no-cache");
  res.headers.set("Expires", "0");

  // 3) Belt + suspenders: expire common cookie variants (domain/path)
  const host = req.headers.get("host") || "";
  const hostNoPort = host.split(":")[0];

  const parts = hostNoPort.split(".");
  const baseDomain = parts.length >= 2 ? parts.slice(-2).join(".") : hostNoPort;

  const DOMAINS = [undefined, baseDomain, `.${baseDomain}`].filter(Boolean) as (string | undefined)[];

  for (const name of LOGOUT_COOKIE_NAMES) {
    for (const path of LOGOUT_COOKIE_PATHS) {
      // no-domain
      res.cookies.set(name, "", { path, expires: new Date(0), maxAge: 0 });

      // domain variants
      for (const domain of DOMAINS) {
        if (domain) {
          res.cookies.set(name, "", { path, domain, expires: new Date(0), maxAge: 0 });
        }
      }
    }
  }

  return res;
}
