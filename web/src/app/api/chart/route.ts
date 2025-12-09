import { NextResponse, NextRequest } from "next/server";

// Simple in-memory rate limiter
// NOTE: This is per-process and will reset on server restart.
// For production-grade protection, combine this with Nginx + Fail2ban.
const RATE_WINDOW_MS = 5000; // 5 seconds
const RATE_MAX_REQUESTS = 20;

type RateState = {
  count: number;
  windowStart: number;
};

const rateStore = new Map<string, RateState>();

function checkRateLimit(identifier: string): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  const existing = rateStore.get(identifier);

  if (!existing) {
    rateStore.set(identifier, { count: 1, windowStart: now });
    return { allowed: true, retryAfterMs: 0 };
  }

  const elapsed = now - existing.windowStart;

  if (elapsed > RATE_WINDOW_MS) {
    // reset window
    rateStore.set(identifier, { count: 1, windowStart: now });
    return { allowed: true, retryAfterMs: 0 };
  }

  if (existing.count >= RATE_MAX_REQUESTS) {
    const retryAfterMs = RATE_WINDOW_MS - elapsed;
    return { allowed: false, retryAfterMs };
  }

  existing.count += 1;
  rateStore.set(identifier, existing);
  return { allowed: true, retryAfterMs: 0 };
}

export async function POST(request: NextRequest) {
  try {
    // Use IP (or forwarded IP) as rate-limit key
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.ip ||
      "unknown";

    const { allowed, retryAfterMs } = checkRateLimit(ip);

    if (!allowed) {
      const retryAfterSeconds = Math.ceil(retryAfterMs / 1000);
      return new NextResponse(
        JSON.stringify({
          ok: false,
          error: "Too many requests. Slow down.",
          retryAfterSeconds,
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(retryAfterSeconds),
          },
        }
      );
    }

    const body = await request.json();

    const astroRes = await fetch("http://127.0.0.1:3002/chart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!astroRes.ok) {
      const errText = await astroRes.text();
      return NextResponse.json({ ok: false, error: errText }, { status: 500 });
    }

    const data = await astroRes.json();

    // Ensure a consistent response shape for the frontend
    return NextResponse.json({
      ok: true,
      input: body,
      data,
    });
  } catch (err: any) {
    console.error("Chart API error:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Unknown error" },
      { status: 500 }
    );
  }
}
