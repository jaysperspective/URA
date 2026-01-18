import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserIdFromRequest } from "@/lib/auth";
import { withStandardRateLimit } from "@/lib/withRateLimit";

export const dynamic = "force-dynamic";

type InEvent = {
  type: string;      // "pageview" | "feature" | "error" | "timing" | ...
  name?: string;
  path?: string;
  severity?: string; // "info" | "warn" | "error"
  sessionToken?: string;
  durationMs?: number;
  statusCode?: number;
  meta?: any;
};

function cleanStr(v: unknown, max = 200): string | undefined {
  if (typeof v !== "string") return undefined;
  const s = v.trim();
  if (!s) return undefined;
  return s.length > max ? s.slice(0, max) : s;
}

/**
 * SECURITY: Validate and sanitize the meta field.
 * - Limits total size to prevent DoS via large payloads
 * - Only allows plain objects (not arrays at root level)
 * - Recursively limits string values
 */
const MAX_META_SIZE_BYTES = 10_000; // 10KB max for meta field
const MAX_META_STRING_LENGTH = 1000;
const MAX_META_DEPTH = 5;

function sanitizeMeta(meta: unknown, depth = 0): Record<string, unknown> | undefined {
  if (meta === undefined || meta === null) return undefined;
  if (typeof meta !== "object" || Array.isArray(meta)) return undefined;
  if (depth > MAX_META_DEPTH) return undefined;

  // Check serialized size
  const serialized = JSON.stringify(meta);
  if (serialized.length > MAX_META_SIZE_BYTES) {
    return { _truncated: true, _reason: "meta too large" };
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(meta)) {
    // Sanitize key
    const cleanKey = String(key).slice(0, 100);

    if (typeof value === "string") {
      sanitized[cleanKey] = value.slice(0, MAX_META_STRING_LENGTH);
    } else if (typeof value === "number" || typeof value === "boolean") {
      sanitized[cleanKey] = value;
    } else if (value === null) {
      sanitized[cleanKey] = null;
    } else if (Array.isArray(value)) {
      // Allow arrays but limit size
      sanitized[cleanKey] = value.slice(0, 50).map(v =>
        typeof v === "string" ? v.slice(0, MAX_META_STRING_LENGTH) :
        typeof v === "number" || typeof v === "boolean" || v === null ? v :
        "[filtered]"
      );
    } else if (typeof value === "object") {
      sanitized[cleanKey] = sanitizeMeta(value, depth + 1) ?? "[filtered]";
    }
  }

  return sanitized;
}

async function handlePost(req: NextRequest) {
  let body: InEvent | null = null;
  try {
    body = (await req.json()) as InEvent;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const type = cleanStr(body?.type, 40);
  if (!type) return NextResponse.json({ ok: false, error: "Missing type" }, { status: 400 });

  // If logged in, attach userId (no hard requirement)
  const userId = await getSessionUserIdFromRequest(req);

  await prisma.event.create({
    data: {
      type,
      name: cleanStr(body?.name, 120),
      path: cleanStr(body?.path, 200),
      severity: cleanStr(body?.severity, 20),
      userId: userId ?? null,
      sessionToken: cleanStr(body?.sessionToken, 200),
      durationMs: typeof body?.durationMs === "number" ? Math.max(0, Math.floor(body.durationMs)) : null,
      statusCode: typeof body?.statusCode === "number" ? Math.floor(body.statusCode) : null,
      // SECURITY: Sanitize meta field to prevent DoS and limit stored data
      meta: sanitizeMeta(body?.meta),
    },
  });

  return NextResponse.json({ ok: true });
}

export const POST = withStandardRateLimit(handlePost);
