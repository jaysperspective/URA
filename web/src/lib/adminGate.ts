import { cookies } from "next/headers";
import { adminCookie, verifyAdminCookieValue } from "@/lib/adminAuth";

export async function isAdminUnlocked(): Promise<boolean> {
  const secret = process.env.URA_ADMIN_COOKIE_SECRET || "";
  if (!secret) return false;

  const jar = await cookies();
  const raw = jar.get(adminCookie.name)?.value;
  return verifyAdminCookieValue(secret, raw);
}
