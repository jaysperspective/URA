import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserIdFromRequest } from "@/lib/auth";

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

export async function POST(req: Request) {
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
      meta: body?.meta ?? undefined,
    },
  });

  return NextResponse.json({ ok: true });
}
