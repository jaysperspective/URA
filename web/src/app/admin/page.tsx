// src/app/admin/page.tsx
import { cookies } from "next/headers";
import { verifyAdminCookieValue, adminCookie } from "@/lib/adminAuth";
import AdminClient from "./ui/AdminClient";
import { getAdminMetrics } from "./metrics";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const cookieSecret = process.env.URA_ADMIN_COOKIE_SECRET || "";
  const masterKey = process.env.URA_MASTER_KEY || "";

  // Next.js 16 typing in your repo treats cookies() as async
  const jar = await cookies();
  const raw = jar.get(adminCookie.name)?.value;

  const isUnlocked = !!cookieSecret && verifyAdminCookieValue(cookieSecret, raw);

  const metrics = isUnlocked ? await getAdminMetrics() : null;

  return (
    <AdminClient
      unlocked={isUnlocked}
      masterKey={isUnlocked ? masterKey : ""}
      metrics={metrics}
      serverHasConfig={{
        hasMasterKey: !!process.env.URA_MASTER_KEY,
        hasAdminPassword: !!process.env.URA_ADMIN_PASSWORD,
        hasCookieSecret: !!process.env.URA_ADMIN_COOKIE_SECRET,
      }}
    />
  );
}
