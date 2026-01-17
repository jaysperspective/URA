// src/lib/auth/requireUser.ts
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getCurrentUser } from "@/lib/auth";

/**
 * Server-only helper.
 * Returns the current user or redirects to /login if not authenticated.
 * Preserves the current URL as returnTo parameter for post-login redirect.
 */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    // Try to get the current URL to preserve it as returnTo
    let returnTo = "/profile";
    try {
      const headersList = await headers();
      // x-url is set by middleware in some setups, or use referer as fallback
      const url = headersList.get("x-url") || headersList.get("x-invoke-path");
      const query = headersList.get("x-invoke-query");

      if (url) {
        returnTo = query ? `${url}?${query}` : url;
      }
    } catch {
      // Fallback - can't get headers, just redirect to login
    }

    // Only include returnTo if it's not just /profile (to keep URLs clean)
    if (returnTo && returnTo !== "/profile" && returnTo !== "/profile/") {
      redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`);
    }
    redirect("/login");
  }
  return user;
}
