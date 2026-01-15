// src/lib/cookies.ts
// Centralized cookie name constants

/**
 * Primary session cookie name - this is what we write.
 */
export const SESSION_COOKIE_NAME = "session";

/**
 * Legacy cookie names to check during auth (for migration compatibility).
 * These are checked as fallbacks when reading cookies.
 */
export const LEGACY_COOKIE_CANDIDATES = [
  "sessionToken",
  "token",
  "auth",
  "ura_session",
] as const;

/**
 * All cookie names to clear on logout (belt + suspenders cleanup).
 * Includes primary, legacy, and any third-party auth cookies.
 */
export const LOGOUT_COOKIE_NAMES = [
  SESSION_COOKIE_NAME,
  ...LEGACY_COOKIE_CANDIDATES,
  "sessionId",
  "sid",
  "auth_token",
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
] as const;

/**
 * Cookie paths to clear during logout.
 */
export const LOGOUT_COOKIE_PATHS = ["/", "/profile", "/logout", "/api"] as const;

/**
 * Admin cookie name for admin unlock sessions.
 */
export const ADMIN_COOKIE_NAME = "ura_admin";

/**
 * Session cookie options for secure cookie settings.
 */
export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  // 30 days in seconds
  maxAge: 30 * 24 * 60 * 60,
};

/**
 * Admin cookie options (shorter TTL).
 */
export const ADMIN_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  // 8 hours in seconds
  maxAge: 8 * 60 * 60,
};
