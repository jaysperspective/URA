"use server";

import { cookies, headers } from "next/headers";
import { adminCookie, makeAdminCookieValue } from "@/lib/adminAuth";
import { auditLog } from "@/lib/audit";

export async function adminUnlockAction(_: any, formData: FormData) {
  const password = String(formData.get("password") || "");

  const expected = process.env.URA_ADMIN_PASSWORD || "";
  const cookieSecret = process.env.URA_ADMIN_COOKIE_SECRET || "";

  if (!expected || !cookieSecret) {
    return { ok: false, error: "Server missing URA_ADMIN_PASSWORD or URA_ADMIN_COOKIE_SECRET." };
  }

  if (password !== expected) {
    await auditLog({ action: "admin.unlock_failed" });
    return { ok: false, error: "Invalid password." };
  }

  const value = makeAdminCookieValue(cookieSecret);

  const jar = await cookies();
  jar.set(adminCookie.name, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: adminCookie.maxAgeSeconds,
  });

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip");

  await auditLog({ action: "admin.unlock", ip });

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

  await auditLog({ action: "admin.lock" });

  return { ok: true };
}

