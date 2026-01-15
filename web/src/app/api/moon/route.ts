// src/app/api/moon/route.ts
import { NextRequest, NextResponse } from "next/server";
import { withStandardRateLimit } from "@/lib/withRateLimit";

function buildOrigin(req: Request) {
  const url = new URL(req.url);
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || url.host;
  const proto = req.headers.get("x-forwarded-proto") || url.protocol.replace(":", "") || "http";
  return `${proto}://${host}`;
}

async function handleGet(req: NextRequest) {
  const origin = buildOrigin(req);

  const res = await fetch(`${origin}/api/moon-calendar`, {
    cache: "no-store",
    headers: { accept: "application/json" },
  });

  const text = await res.text();

  try {
    const json = JSON.parse(text);
    return NextResponse.json(json, { status: res.status });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Upstream /api/moon-calendar did not return JSON" },
      { status: 502 }
    );
  }
}

export const GET = withStandardRateLimit(handleGet);
