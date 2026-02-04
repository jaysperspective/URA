// src/lib/withRateLimit.ts
// Higher-order function to wrap route handlers with rate limiting

import { NextRequest, NextResponse } from "next/server";
import {
  checkRateLimit,
  getClientIdentifier,
  rateLimitedResponse,
  addRateLimitHeaders,
  RateLimitConfig,
  RATE_LIMITS,
} from "./rateLimit";

type RouteHandler = (
  req: NextRequest,
  context?: { params?: Promise<Record<string, string>> }
) => Promise<NextResponse> | NextResponse;

/**
 * Wrap a route handler with rate limiting.
 */
export function withRateLimit(
  handler: RouteHandler,
  config: RateLimitConfig = RATE_LIMITS.standard
): RouteHandler {
  return async (req: NextRequest, context?) => {
    const identifier = getClientIdentifier(req);
    const { allowed, remaining, resetIn } = await checkRateLimit(identifier, config);

    if (!allowed) {
      return rateLimitedResponse(resetIn);
    }

    const response = await handler(req, context);

    // Add rate limit headers to successful responses
    return addRateLimitHeaders(response, remaining, resetIn);
  };
}

/**
 * Standard rate limit: 60 requests per minute.
 * Use for general API endpoints.
 */
export const withStandardRateLimit = (handler: RouteHandler) =>
  withRateLimit(handler, RATE_LIMITS.standard);

/**
 * Compute rate limit: 20 requests per minute.
 * Use for expensive operations (astro calculations, market data).
 */
export const withComputeRateLimit = (handler: RouteHandler) =>
  withRateLimit(handler, RATE_LIMITS.compute);

/**
 * Auth rate limit: 5 attempts per minute.
 * Use for login/signup to prevent brute force.
 */
export const withAuthRateLimit = (handler: RouteHandler) =>
  withRateLimit(handler, RATE_LIMITS.authAction);

/**
 * Authenticated rate limit: 120 requests per minute.
 * Use for endpoints that require authentication.
 */
export const withAuthenticatedRateLimit = (handler: RouteHandler) =>
  withRateLimit(handler, RATE_LIMITS.authenticated);
