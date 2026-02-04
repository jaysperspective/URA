// src/lib/__tests__/apiErrors.test.ts
import { describe, it, expect, vi } from "vitest";
import {
  apiError,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  validationError,
  rateLimited,
  externalServiceError,
  databaseError,
  internalError,
  isExternalServiceFailure,
  safeJsonParse,
} from "../apiErrors";

describe("apiErrors", () => {
  describe("apiError", () => {
    it("creates error response with correct structure", async () => {
      const response = apiError("Test error", "BAD_REQUEST");
      const body = await response.json();

      expect(body.ok).toBe(false);
      expect(body.error).toBe("Test error");
      expect(body.code).toBe("BAD_REQUEST");
    });

    it("includes details when provided", async () => {
      const response = apiError("Error", "VALIDATION_ERROR", { field: "email" });
      const body = await response.json();

      expect(body.details).toEqual({ field: "email" });
    });

    it("omits details when not provided", async () => {
      const response = apiError("Error", "BAD_REQUEST");
      const body = await response.json();

      expect(body.details).toBeUndefined();
    });

    it("returns correct status codes for each error code", async () => {
      expect(apiError("", "BAD_REQUEST").status).toBe(400);
      expect(apiError("", "UNAUTHORIZED").status).toBe(401);
      expect(apiError("", "FORBIDDEN").status).toBe(403);
      expect(apiError("", "NOT_FOUND").status).toBe(404);
      expect(apiError("", "VALIDATION_ERROR").status).toBe(422);
      expect(apiError("", "RATE_LIMITED").status).toBe(429);
      expect(apiError("", "EXTERNAL_SERVICE_ERROR").status).toBe(502);
      expect(apiError("", "DATABASE_ERROR").status).toBe(503);
      expect(apiError("", "INTERNAL_ERROR").status).toBe(500);
    });
  });

  describe("convenience helpers", () => {
    it("badRequest returns 400", async () => {
      const response = badRequest("Invalid input");
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.code).toBe("BAD_REQUEST");
    });

    it("badRequest includes details", async () => {
      const response = badRequest("Invalid", { field: "name" });
      const body = await response.json();
      expect(body.details).toEqual({ field: "name" });
    });

    it("unauthorized returns 401 with default message", async () => {
      const response = unauthorized();
      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error).toBe("Unauthorized");
    });

    it("unauthorized accepts custom message", async () => {
      const response = unauthorized("Invalid token");
      const body = await response.json();
      expect(body.error).toBe("Invalid token");
    });

    it("forbidden returns 403", async () => {
      const response = forbidden();
      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body.error).toBe("Forbidden");
    });

    it("notFound returns 404", async () => {
      const response = notFound();
      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body.error).toBe("Not found");
    });

    it("notFound accepts custom message", async () => {
      const response = notFound("User not found");
      const body = await response.json();
      expect(body.error).toBe("User not found");
    });

    it("validationError returns 422", async () => {
      const response = validationError("Invalid data", { fields: ["email"] });
      expect(response.status).toBe(422);
      const body = await response.json();
      expect(body.code).toBe("VALIDATION_ERROR");
      expect(body.details).toEqual({ fields: ["email"] });
    });

    it("rateLimited returns 429", async () => {
      const response = rateLimited();
      expect(response.status).toBe(429);
      const body = await response.json();
      expect(body.code).toBe("RATE_LIMITED");
    });

    it("rateLimited includes retryAfterSeconds when provided", async () => {
      const response = rateLimited(60);
      const body = await response.json();
      expect(body.details).toEqual({ retryAfterSeconds: 60 });
    });

    it("externalServiceError returns 502 with service info", async () => {
      const response = externalServiceError("astro-service", "Connection refused");
      expect(response.status).toBe(502);
      const body = await response.json();
      expect(body.code).toBe("EXTERNAL_SERVICE_ERROR");
      expect(body.details?.service).toBe("astro-service");
      expect(body.details?.originalError).toBe("Connection refused");
    });

    it("databaseError returns 503", async () => {
      const response = databaseError();
      expect(response.status).toBe(503);
      const body = await response.json();
      expect(body.code).toBe("DATABASE_ERROR");
    });

    it("internalError returns 500", async () => {
      const response = internalError();
      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.code).toBe("INTERNAL_ERROR");
    });
  });

  describe("isExternalServiceFailure", () => {
    it("returns true for astro-service errors", () => {
      expect(isExternalServiceFailure(new Error("astro-service timeout"))).toBe(true);
    });

    it("returns true for ECONNREFUSED errors", () => {
      expect(isExternalServiceFailure(new Error("ECONNREFUSED"))).toBe(true);
    });

    it("returns true for fetch failed errors", () => {
      expect(isExternalServiceFailure(new Error("fetch failed"))).toBe(true);
    });

    it("returns true for network errors", () => {
      expect(isExternalServiceFailure(new Error("network error"))).toBe(true);
    });

    it("returns true for timeout errors", () => {
      expect(isExternalServiceFailure(new Error("request timeout"))).toBe(true);
    });

    it("returns true for socket hang up errors", () => {
      expect(isExternalServiceFailure(new Error("socket hang up"))).toBe(true);
    });

    it("returns true for getaddrinfo errors", () => {
      expect(isExternalServiceFailure(new Error("getaddrinfo ENOTFOUND"))).toBe(true);
    });

    it("returns false for regular errors", () => {
      expect(isExternalServiceFailure(new Error("Invalid input"))).toBe(false);
    });

    it("returns false for non-Error objects", () => {
      expect(isExternalServiceFailure("string error")).toBe(false);
      expect(isExternalServiceFailure({ message: "object error" })).toBe(false);
      expect(isExternalServiceFailure(null)).toBe(false);
      expect(isExternalServiceFailure(undefined)).toBe(false);
    });

    it("is case insensitive", () => {
      expect(isExternalServiceFailure(new Error("ASTRO-SERVICE error"))).toBe(true);
      expect(isExternalServiceFailure(new Error("Fetch Failed"))).toBe(true);
    });
  });

  describe("safeJsonParse", () => {
    it("parses valid JSON", () => {
      expect(safeJsonParse('{"key": "value"}')).toEqual({ key: "value" });
    });

    it("parses JSON arrays", () => {
      expect(safeJsonParse("[1, 2, 3]")).toEqual([1, 2, 3]);
    });

    it("returns null for invalid JSON", () => {
      expect(safeJsonParse("not json")).toBe(null);
    });

    it("extracts JSON from text with prefix", () => {
      expect(safeJsonParse('Some text before {"key": "value"}')).toEqual({ key: "value" });
    });

    it("extracts JSON from text with suffix", () => {
      expect(safeJsonParse('{"key": "value"} some text after')).toEqual({ key: "value" });
    });

    it("extracts JSON from text with prefix and suffix", () => {
      expect(safeJsonParse('prefix {"key": "value"} suffix')).toEqual({ key: "value" });
    });

    it("returns null when no valid JSON can be extracted", () => {
      expect(safeJsonParse("no json here")).toBe(null);
    });

    it("returns null for partial JSON", () => {
      expect(safeJsonParse('{"key": "value"')).toBe(null);
    });

    it("handles nested objects", () => {
      const input = '{"outer": {"inner": "value"}}';
      expect(safeJsonParse(input)).toEqual({ outer: { inner: "value" } });
    });

    it("handles empty object", () => {
      expect(safeJsonParse("{}")).toEqual({});
    });
  });
});
