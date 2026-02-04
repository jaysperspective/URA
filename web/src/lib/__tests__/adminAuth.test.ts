// src/lib/__tests__/adminAuth.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  makeAdminCookieValue,
  verifyAdminCookieValue,
  adminCookie,
} from "../adminAuth";

describe("adminAuth", () => {
  const TEST_SECRET = "test-secret-key-12345";

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-15T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("adminCookie constants", () => {
    it("has correct cookie name", () => {
      expect(adminCookie.name).toBe("ura_admin");
    });

    it("has 8 hour max age", () => {
      expect(adminCookie.maxAgeSeconds).toBe(8 * 60 * 60);
    });
  });

  describe("makeAdminCookieValue", () => {
    it("creates a cookie value in correct format", () => {
      const value = makeAdminCookieValue(TEST_SECRET);
      expect(value).toMatch(/^v1\.\d+\.[A-Za-z0-9_-]+$/);
    });

    it("includes future expiration timestamp", () => {
      const value = makeAdminCookieValue(TEST_SECRET);
      const [, expStr] = value.split(".");
      const exp = Number(expStr);
      const now = Math.floor(Date.now() / 1000);

      expect(exp).toBeGreaterThan(now);
      // Should be ~8 hours in the future
      expect(exp - now).toBe(8 * 60 * 60);
    });

    it("produces different signatures for different secrets", () => {
      const value1 = makeAdminCookieValue("secret-1");
      const value2 = makeAdminCookieValue("secret-2");

      const sig1 = value1.split(".")[2];
      const sig2 = value2.split(".")[2];

      expect(sig1).not.toBe(sig2);
    });

    it("produces consistent values for same secret at same time", () => {
      const value1 = makeAdminCookieValue(TEST_SECRET);
      const value2 = makeAdminCookieValue(TEST_SECRET);

      expect(value1).toBe(value2);
    });
  });

  describe("verifyAdminCookieValue", () => {
    it("returns true for valid, non-expired cookie", () => {
      const value = makeAdminCookieValue(TEST_SECRET);
      expect(verifyAdminCookieValue(TEST_SECRET, value)).toBe(true);
    });

    it("returns false for wrong secret", () => {
      const value = makeAdminCookieValue(TEST_SECRET);
      expect(verifyAdminCookieValue("wrong-secret", value)).toBe(false);
    });

    it("returns false for expired cookie", () => {
      const value = makeAdminCookieValue(TEST_SECRET);
      // Advance time past 8 hours
      vi.advanceTimersByTime(9 * 60 * 60 * 1000);
      expect(verifyAdminCookieValue(TEST_SECRET, value)).toBe(false);
    });

    it("returns false for null value", () => {
      expect(verifyAdminCookieValue(TEST_SECRET, null)).toBe(false);
    });

    it("returns false for undefined value", () => {
      expect(verifyAdminCookieValue(TEST_SECRET, undefined)).toBe(false);
    });

    it("returns false for empty string", () => {
      expect(verifyAdminCookieValue(TEST_SECRET, "")).toBe(false);
    });

    it("returns false for malformed cookie - wrong number of parts", () => {
      expect(verifyAdminCookieValue(TEST_SECRET, "invalid")).toBe(false);
      expect(verifyAdminCookieValue(TEST_SECRET, "v1.123")).toBe(false);
      expect(verifyAdminCookieValue(TEST_SECRET, "v1.123.sig.extra")).toBe(false);
    });

    it("returns false for wrong version", () => {
      const value = makeAdminCookieValue(TEST_SECRET);
      const tamperedValue = value.replace("v1.", "v2.");
      expect(verifyAdminCookieValue(TEST_SECRET, tamperedValue)).toBe(false);
    });

    it("returns false for non-numeric expiration", () => {
      expect(verifyAdminCookieValue(TEST_SECRET, "v1.abc.xyz")).toBe(false);
    });

    it("returns false for tampered signature", () => {
      const value = makeAdminCookieValue(TEST_SECRET);
      const parts = value.split(".");
      parts[2] = "tampered-signature";
      const tamperedValue = parts.join(".");
      expect(verifyAdminCookieValue(TEST_SECRET, tamperedValue)).toBe(false);
    });

    it("returns false for tampered expiration", () => {
      const value = makeAdminCookieValue(TEST_SECRET);
      const parts = value.split(".");
      // Try to extend expiration
      parts[1] = String(Number(parts[1]) + 3600);
      const tamperedValue = parts.join(".");
      expect(verifyAdminCookieValue(TEST_SECRET, tamperedValue)).toBe(false);
    });

    it("accepts cookie just before expiration", () => {
      const value = makeAdminCookieValue(TEST_SECRET);
      // Advance to just before expiration (7h 59m 59s)
      vi.advanceTimersByTime((8 * 60 * 60 - 1) * 1000);
      expect(verifyAdminCookieValue(TEST_SECRET, value)).toBe(true);
    });
  });
});
