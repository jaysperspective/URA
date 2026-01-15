// src/lib/__tests__/rateLimit.test.ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { checkRateLimit, RATE_LIMITS } from "../rateLimit";

describe("rateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  describe("checkRateLimit", () => {
    it("allows first request", () => {
      const result = checkRateLimit("test-ip-1", RATE_LIMITS.standard);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(59);
    });

    it("decrements remaining count", () => {
      checkRateLimit("test-ip-2", RATE_LIMITS.standard);
      const result = checkRateLimit("test-ip-2", RATE_LIMITS.standard);
      expect(result.remaining).toBe(58);
    });

    it("blocks after max requests", () => {
      const config = { windowMs: 60000, maxRequests: 3, keyPrefix: "test" };

      checkRateLimit("test-ip-3", config);
      checkRateLimit("test-ip-3", config);
      checkRateLimit("test-ip-3", config);

      const result = checkRateLimit("test-ip-3", config);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it("resets after window expires", () => {
      const config = { windowMs: 1000, maxRequests: 2, keyPrefix: "test" };

      checkRateLimit("test-ip-4", config);
      checkRateLimit("test-ip-4", config);

      // Blocked now
      let result = checkRateLimit("test-ip-4", config);
      expect(result.allowed).toBe(false);

      // Advance time past window
      vi.advanceTimersByTime(1001);

      // Should be allowed again
      result = checkRateLimit("test-ip-4", config);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(1);
    });

    it("uses different keys for different prefixes", () => {
      const config1 = { windowMs: 60000, maxRequests: 1, keyPrefix: "api1" };
      const config2 = { windowMs: 60000, maxRequests: 1, keyPrefix: "api2" };

      checkRateLimit("same-ip", config1);
      const result = checkRateLimit("same-ip", config2);

      expect(result.allowed).toBe(true);
    });
  });

  describe("RATE_LIMITS presets", () => {
    it("standard allows 60 requests per minute", () => {
      expect(RATE_LIMITS.standard.maxRequests).toBe(60);
      expect(RATE_LIMITS.standard.windowMs).toBe(60000);
    });

    it("compute allows 20 requests per minute", () => {
      expect(RATE_LIMITS.compute.maxRequests).toBe(20);
    });

    it("authAction allows 5 requests per minute", () => {
      expect(RATE_LIMITS.authAction.maxRequests).toBe(5);
    });
  });
});
