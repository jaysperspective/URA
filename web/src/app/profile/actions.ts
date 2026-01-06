// src/app/profile/actions.ts
"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function logoutAction() {
  const jar = await cookies();

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
      jar.delete(name);
    } catch {
      // ignore
    }
  }

  redirect("/calendar");
}
