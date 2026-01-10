// src/lib/auth.ts
import crypto from "crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// --- cookie config ---
export const SESSION_COOKIE_NAME = "session"; // must match your existing app expectation
const SESSION_TTL_DAYS = 30;

// --- password helpers ---
export async function hashPassword(plain: string): Promise<string> {
  const s = plain.trim();
  if (!s) throw new Error("Password required");
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(s, salt);
}

export async function verifyPassword(plain: string, passwordHash: string): Promise<boolean> {
  if (!plain || !passwordHash) return false;
  return bcrypt.compare(plain, passwordHash);
}

// --- session helpers ---
function newToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

function expiresAtFromNow(): Date {
  const d = new Date();
  d.setDate(d.getDate() + SESSION_TTL_DAYS);
  return d;
}

/**
 * Creates a DB session and sets the session cookie.
 * Use from server actions (login/signup).
 */
export async function createSession(userId: number): Promise<{ token: string; expiresAt: Date }> {
  const token = newToken();
  const expiresAt = expiresAtFromNow();

  await prisma.session.create({
    data: { userId, token, expiresAt },
  });

  // Next 16 headers() / cookies() are server-only. This is used in server actions.
  const jar = await cookies();
  jar.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });

  return { token, expiresAt };
}

/**
 * Clears the session cookie and (optionally) deletes the DB session.
 * Use from /api/logout.
 */
export async function clearSession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE_NAME)?.value;

  // Clear cookie first
  jar.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  if (!token) return;

  // Best-effort DB cleanup
  try {
    await prisma.session.delete({ where: { token } });
  } catch {
    // ignore (already deleted / token invalid)
  }
}

/**
 * Returns the current logged-in user (or null).
 * Used by pages, api/me, and requireUser().
 */

export async function getCurrentUser() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const now = new Date();

  const session = await prisma.session.findUnique({
    where: { token },
    select: { userId: true, expiresAt: true },
  });

  if (!session) return null;
  if (session.expiresAt <= now) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      displayName: true,
      createdAt: true,
      status: true,
      profile: true,
    },
  });

  if (!user) return null;
  if (user.status !== "ACTIVE") return null;

  return user;
}

// ---------------------------------------------------------------------------
// API-route helper: derive userId from Authorization Bearer OR cookie header.
// Used by /api/seen and any other app-route that has a Request object.
// ---------------------------------------------------------------------------

function parseCookieHeader(header: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of header.split(";")) {
    const [rawK, ...rawV] = part.trim().split("=");
    if (!rawK) continue;
    const k = rawK;
    const v = rawV.join("=");
    if (!v) continue;
    try {
      out[k] = decodeURIComponent(v);
    } catch {
      out[k] = v;
    }
  }
  return out;
}

function getTokenFromRequest(req: Request): string | null {
  // 1) Authorization header
  const auth = req.headers.get("authorization");
  if (auth) {
    const m = auth.match(/^Bearer\s+(.+)$/i);
    if (m?.[1]) return m[1].trim();
  }

  // 2) Cookies
  const cookieHeader = req.headers.get("cookie");
  if (!cookieHeader) return null;

  const jar = parseCookieHeader(cookieHeader);

  // Prefer your canonical cookie name first
  const candidates = [
    SESSION_COOKIE_NAME,
    "sessionToken",
    "token",
    "auth",
    "ura_session",
  ];

  for (const name of candidates) {
    const v = jar[name];
    if (v) return v;
  }

  return null;
}

/**
 * App-route helper: returns userId if request carries a valid Session token.
 */
export async function getSessionUserIdFromRequest(req: Request): Promise<number | null> {
  const token = getTokenFromRequest(req);
  if (!token) return null;

  const now = new Date();

  const session = await prisma.session.findUnique({
    where: { token },
    select: { userId: true, expiresAt: true },
  });

  if (!session) return null;
  if (session.expiresAt <= now) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, status: true },
  });

  if (!user) return null;
  if (user.status !== "ACTIVE") return null;

  return user.id;
}
