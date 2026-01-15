// src/lib/rateLimit.ts
// In-memory rate limiter with sliding window

import { NextResponse, NextRequest } from "next/server";

export type RateLimitConfig = {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  keyPrefix?: string; // Prefix for rate limit key
};

type RateLimitEntry = {
  count: number;
  windowStart: number;
};

// In-memory store (use Redis for multi-instance deployments)
const store = new Map<string, RateLimitEntry>();

// Cleanup old entries periodically
const CLEANUP_INTERVAL_MS = 60_000;
let lastCleanup = Date.now();

function cleanupStaleEntries(maxAge: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;

  for (const [key, entry] of store.entries()) {
    if (now - entry.windowStart > maxAge) {
      store.delete(key);
    }
  }
  lastCleanup = now;
}

/**
 * Get a unique identifier for the client (IP address).
 */
export function getClientIdentifier(req: NextRequest | Request): string {
  const headers = req.headers;
  const forwardedFor = headers.get("x-forwarded-for");
  const realIp = headers.get("x-real-ip");
  return forwardedFor?.split(",")[0]?.trim() || realIp || "unknown";
}

/**
 * Check if a request is rate limited.
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const key = `${config.keyPrefix || "rl"}:${identifier}`;

  cleanupStaleEntries(config.windowMs * 2);

  const entry = store.get(key);

  if (!entry) {
    store.set(key, { count: 1, windowStart: now });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetIn: config.windowMs,
    };
  }

  const elapsed = now - entry.windowStart;

  if (elapsed > config.windowMs) {
    store.set(key, { count: 1, windowStart: now });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetIn: config.windowMs,
    };
  }

  if (entry.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: config.windowMs - elapsed,
    };
  }

  entry.count++;
  store.set(key, entry);

  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetIn: config.windowMs - elapsed,
  };
}

/**
 * Preset rate limit configurations.
 */
export const RATE_LIMITS = {
  // Standard API: 60 requests per minute
  standard: { windowMs: 60_000, maxRequests: 60, keyPrefix: "api" },

  // Authenticated routes: 120 requests per minute
  authenticated: { windowMs: 60_000, maxRequests: 120, keyPrefix: "auth" },

  // Heavy computation routes: 20 requests per minute
  compute: { windowMs: 60_000, maxRequests: 20, keyPrefix: "compute" },

  // Auth actions (login/signup): 5 attempts per minute
  authAction: { windowMs: 60_000, maxRequests: 5, keyPrefix: "authAction" },
} as const;

/**
 * Create a rate limited response with proper headers.
 */
export function rateLimitedResponse(resetIn: number): NextResponse {
  const retryAfterSeconds = Math.ceil(resetIn / 1000);
  return new NextResponse(
    JSON.stringify({
      ok: false,
      error: "Too many requests. Please slow down.",
      code: "RATE_LIMITED",
      retryAfterSeconds,
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfterSeconds),
        "X-RateLimit-Reset": String(Date.now() + resetIn),
      },
    }
  );
}

/**
 * Add rate limit headers to a response.
 */
export function addRateLimitHeaders(
  response: NextResponse,
  remaining: number,
  resetIn: number
): NextResponse {
  response.headers.set("X-RateLimit-Remaining", String(remaining));
  response.headers.set("X-RateLimit-Reset", String(Date.now() + resetIn));
  return response;
}
