// src/lib/apiErrors.ts
// Centralized API error response utility

import { NextResponse } from "next/server";

export type ApiErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "RATE_LIMITED"
  | "EXTERNAL_SERVICE_ERROR"
  | "DATABASE_ERROR"
  | "INTERNAL_ERROR";

export type ApiError = {
  ok: false;
  error: string;
  code: ApiErrorCode;
  details?: Record<string, unknown>;
};

export type ApiSuccess<T = unknown> = {
  ok: true;
  data?: T;
  [key: string]: unknown;
};

const CODE_TO_STATUS: Record<ApiErrorCode, number> = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  VALIDATION_ERROR: 422,
  RATE_LIMITED: 429,
  EXTERNAL_SERVICE_ERROR: 502,
  DATABASE_ERROR: 503,
  INTERNAL_ERROR: 500,
};

/**
 * Create a standardized API error response.
 */
export function apiError(
  message: string,
  code: ApiErrorCode = "BAD_REQUEST",
  details?: Record<string, unknown>
): NextResponse<ApiError> {
  const status = CODE_TO_STATUS[code];
  const body: ApiError = { ok: false, error: message, code };
  if (details) body.details = details;

  return NextResponse.json(body, { status });
}

// Convenience helpers

export const badRequest = (msg: string, details?: Record<string, unknown>) =>
  apiError(msg, "BAD_REQUEST", details);

export const unauthorized = (msg = "Unauthorized") =>
  apiError(msg, "UNAUTHORIZED");

export const forbidden = (msg = "Forbidden") => apiError(msg, "FORBIDDEN");

export const notFound = (msg = "Not found") => apiError(msg, "NOT_FOUND");

export const validationError = (
  msg: string,
  details?: Record<string, unknown>
) => apiError(msg, "VALIDATION_ERROR", details);

export const rateLimited = (retryAfterSeconds?: number) =>
  apiError(
    "Too many requests",
    "RATE_LIMITED",
    retryAfterSeconds ? { retryAfterSeconds } : undefined
  );

export const externalServiceError = (
  service: string,
  originalError?: string
) =>
  apiError(`External service unavailable: ${service}`, "EXTERNAL_SERVICE_ERROR", {
    service,
    originalError,
  });

export const databaseError = (msg = "Database operation failed") =>
  apiError(msg, "DATABASE_ERROR");

export const internalError = (msg = "Internal server error") =>
  apiError(msg, "INTERNAL_ERROR");

/**
 * Check if an error is from an external service failure.
 * Use this in catch blocks to determine if 502 should be returned.
 */
export function isExternalServiceFailure(error: unknown): boolean {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return (
      msg.includes("astro-service") ||
      msg.includes("econnrefused") ||
      msg.includes("fetch failed") ||
      msg.includes("network") ||
      msg.includes("timeout") ||
      msg.includes("socket hang up") ||
      msg.includes("getaddrinfo")
    );
  }
  return false;
}

/**
 * Safe JSON parsing utility - attempts to extract JSON from potentially malformed strings.
 */
export function safeJsonParse<T = unknown>(s: string): T | null {
  try {
    return JSON.parse(s) as T;
  } catch {
    // Try to extract JSON object from string
    const start = s.indexOf("{");
    const end = s.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(s.slice(start, end + 1)) as T;
      } catch {
        return null;
      }
    }
    return null;
  }
}

/**
 * Wrap an async handler with standardized error handling.
 * Catches errors and returns appropriate error responses.
 */
export function withErrorHandling<T extends (...args: unknown[]) => Promise<NextResponse>>(
  handler: T,
  serviceName?: string
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await handler(...args);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error(`[API Error]${serviceName ? ` [${serviceName}]` : ""}:`, err);

      if (isExternalServiceFailure(err)) {
        return externalServiceError(serviceName || "external", message);
      }
      return internalError(message);
    }
  }) as T;
}
