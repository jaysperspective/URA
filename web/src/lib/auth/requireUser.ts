// src/lib/auth/requireUser.ts
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

/**
 * Server-only helper.
 * Returns the current user or redirects to /login if not authenticated.
 */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
