import { NextResponse } from "next/server";

function buildOrigin(req: Request) {
  const url = new URL(req.url);
  const host =
    req.headers.get("x-forwarded-host") ||
    req.headers.get("host") ||
    url.host;
  const proto =
    req.headers.get("x-forwarded-proto") ||
    url.protocol.replace(":", "") ||
    "http";
  return `${proto}://${host}`;
}

export async function GET(req: Request) {
  const origin = buildOrigin(req);

  // Proxy to the real endpoint that exists in your codebase
  const res = await fetch(`${origin}/api/moon-calendar`, {
    cache: "no-store",
    headers: { accept: "application/json" },
  });

  const text = await res.text();

  // Pass-through if it’s already JSON
  try {
    const json = JSON.parse(text);
    return NextResponse.json(json, { status: res.status });
  } catch {
    // If the upstream returned HTML or something unexpected
    return NextResponse.json(
      { ok: false, error: "Upstream /api/moon-calendar did not return JSON" },
      { status: 502 }
    );
  }
}
