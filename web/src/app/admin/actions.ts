// src/app/admin/action.ts

"use server";

import { cookies } from "next/headers";
import { adminCookie, makeAdminCookieValue } from "@/lib/adminAuth";

export async function adminUnlockAction(_: any, formData: FormData) {
  const password = String(formData.get("password") || "");

  const expected = process.env.URA_ADMIN_PASSWORD || "";
  const cookieSecret = process.env.URA_ADMIN_COOKIE_SECRET || "";

  if (!expected || !cookieSecret) {
    return { ok: false, error: "Server missing URA_ADMIN_PASSWORD or URA_ADMIN_COOKIE_SECRET." };
  }

  if (password !== expected) {
    return { ok: false, error: "Invalid password." };
  }

  const value = makeAdminCookieValue(cookieSecret);

  const jar = await cookies();
  jar.set(adminCookie.name, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production", // safer for local/dev
    path: "/",
    maxAge: adminCookie.maxAgeSeconds,
  });

  return { ok: true };
}

export async function adminLockAction() {
  const jar = await cookies();
  jar.set(adminCookie.name, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  return { ok: true };
}
