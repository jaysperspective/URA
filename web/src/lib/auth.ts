import { prisma } from "@/lib/prisma";

/**
 * Extracts a session token from:
 * 1) Authorization: Bearer <token>
 * 2) Cookies (common names)
 */
function getTokenFromRequest(req: Request): string | null {
  // 1) Authorization header
  const auth = req.headers.get("authorization");
  if (auth) {
    const m = auth.match(/^Bearer\s+(.+)$/i);
    if (m?.[1]) return m[1].trim();
  }

  // 2) Cookie header
  const cookieHeader = req.headers.get("cookie");
  if (!cookieHeader) return null;

  const cookies = parseCookieHeader(cookieHeader);

  // If you already have a known cookie name in your app, put it first here.
  const candidates = [
    "session",        // common
    "sessionToken",   // common
    "token",          // common
    "auth",           // common
    "ura_session",    // project-ish
  ];

  for (const name of candidates) {
    const v = cookies[name];
    if (v) return v;
  }

  return null;
}

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

/**
 * Server helper for app routes: returns the current userId from Session token.
 * - Looks up Session by token
 * - Ensures not expired
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

  return session.userId;
}
