// src/app/profile/actions.ts
"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function logoutAction() {
  const jar = cookies();

  // Clear common auth cookie names (safe no-ops if they don't exist)
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
    try {
      // next/headers cookie store supports delete in recent Next versions
      (jar as any).delete?.(name);
    } catch {
      // fallback: overwrite with an expired cookie
      jar.set(name, "", { path: "/", expires: new Date(0) });
    }
  }

  // Always return user to Calendar after logout
  redirect("/calendar");
}

