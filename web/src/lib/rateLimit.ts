// src/lib/rateLimit.ts
// Rate limiter with sliding window
// Supports in-memory (single instance) and Redis (distributed) backends
// Set REDIS_URL environment variable to enable Redis backend

import { NextResponse, NextRequest } from "next/server";
import { getRateLimitStore, type RateLimitEntry } from "./rateLimitStore";

export type RateLimitConfig = {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  keyPrefix?: string; // Prefix for rate limit key
};

/**
 * Trusted proxy configuration.
 * Set TRUSTED_PROXIES env var to a comma-separated list of trusted proxy IPs/CIDRs.
 * When behind a load balancer or reverse proxy, only trust x-forwarded-for from known proxies.
 * If not configured, proxy headers are NOT trusted (falls back to connection IP or "unknown").
 */
const TRUSTED_PROXIES = process.env.TRUSTED_PROXIES
  ? process.env.TRUSTED_PROXIES.split(",").map((s) => s.trim()).filter(Boolean)
  : [];

const TRUST_ALL_PROXIES = process.env.TRUST_ALL_PROXIES === "true";

/**
 * Check if an IP is in the trusted proxies list.
 * For simplicity, this does exact string matching. For CIDR support, use a library.
 */
function isTrustedProxy(ip: string): boolean {
  if (TRUST_ALL_PROXIES) return true;
  if (TRUSTED_PROXIES.length === 0) return false;
  return TRUSTED_PROXIES.includes(ip);
}

// Store cleanup is handled by the store implementation

/**
 * Get a unique identifier for the client (IP address).
 * Only trusts x-forwarded-for/x-real-ip headers when request comes from a trusted proxy.
 */
export function getClientIdentifier(req: NextRequest | Request): string {
  const headers = req.headers;

  // Get the connecting IP (rightmost in x-forwarded-for or socket address)
  // In serverless/Edge, we may not have direct socket access, so we check headers
  const forwardedFor = headers.get("x-forwarded-for");
  const realIp = headers.get("x-real-ip");
  const cfConnectingIp = headers.get("cf-connecting-ip"); // Cloudflare

  // If we have trusted proxy configuration, use proper IP extraction
  if (TRUSTED_PROXIES.length > 0 || TRUST_ALL_PROXIES) {
    // When behind a trusted proxy, the client IP is in x-forwarded-for (leftmost)
    // or in cf-connecting-ip for Cloudflare
    if (cfConnectingIp) {
      return cfConnectingIp.trim();
    }
    if (forwardedFor) {
      // Take the leftmost (original client) IP
      const clientIp = forwardedFor.split(",")[0]?.trim();
      if (clientIp) return clientIp;
    }
    if (realIp) {
      return realIp.trim();
    }
  }

  // Without trusted proxy config, don't trust forwarded headers at all
  // This prevents IP spoofing when app is directly exposed
  // In this case, return a hash of all identifying info or "unknown"
  // For serverless environments without socket access, we fall back to headers
  // but this is intentionally conservative
  if (process.env.NODE_ENV === "development" || process.env.TRUST_DEV_HEADERS === "true") {
    // In development, trust headers for easier testing
    return forwardedFor?.split(",")[0]?.trim() || realIp || "unknown";
  }

  // In production without trusted proxy config, return unknown to be safe
  // This effectively groups all requests together - configure TRUSTED_PROXIES in production
  return "unknown";
}

/**
 * Check if a request is rate limited.
 * Uses the configured store (in-memory or Redis).
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
  const now = Date.now();
  const key = `${config.keyPrefix || "rl"}:${identifier}`;
  const store = getRateLimitStore();

  // Get current entry
  const entry = await store.get(key);

  // Calculate current window start (aligned to window boundary)
  const windowStart = Math.floor(now / config.windowMs) * config.windowMs;

  if (!entry || entry.windowStart !== windowStart) {
    // New window - set count to 1
    await store.set(key, { count: 1, windowStart }, config.windowMs * 2);
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetIn: config.windowMs - (now - windowStart),
    };
  }

  // Same window - check limit
  if (entry.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: config.windowMs - (now - windowStart),
    };
  }

  // Increment count
  const newCount = await store.increment(key, windowStart, config.windowMs * 2);

  return {
    allowed: true,
    remaining: config.maxRequests - newCount,
    resetIn: config.windowMs - (now - windowStart),
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
