// src/lib/schemas/__tests__/admin.test.ts
import { describe, it, expect } from "vitest";
import {
  flagInputSchema,
  flagOverrideInputSchema,
  userStatusInputSchema,
  userStatusSchema,
} from "../admin";

describe("schemas/admin", () => {
  describe("userStatusSchema", () => {
    it("accepts valid statuses", () => {
      expect(userStatusSchema.safeParse("ACTIVE").success).toBe(true);
      expect(userStatusSchema.safeParse("DISABLED").success).toBe(true);
      expect(userStatusSchema.safeParse("BANNED").success).toBe(true);
    });

    it("rejects invalid status", () => {
      expect(userStatusSchema.safeParse("active").success).toBe(false);
      expect(userStatusSchema.safeParse("SUSPENDED").success).toBe(false);
    });
  });

  describe("flagInputSchema", () => {
    it("accepts valid flag input", () => {
      const result = flagInputSchema.safeParse({
        key: "feature_flag",
        enabled: true,
      });
      expect(result.success).toBe(true);
    });

    it("accepts optional description and payload", () => {
      const result = flagInputSchema.safeParse({
        key: "feature_flag",
        enabled: false,
        description: "Test feature",
        payload: { version: 2 },
      });
      expect(result.success).toBe(true);
    });

    it("validates key format - lowercase alphanumeric with underscores", () => {
      expect(flagInputSchema.safeParse({ key: "valid_key_123", enabled: true }).success).toBe(true);
      expect(flagInputSchema.safeParse({ key: "Invalid-Key", enabled: true }).success).toBe(false);
      expect(flagInputSchema.safeParse({ key: "Invalid Key", enabled: true }).success).toBe(false);
      expect(flagInputSchema.safeParse({ key: "UPPERCASE", enabled: true }).success).toBe(false);
    });

    it("rejects empty key", () => {
      expect(flagInputSchema.safeParse({ key: "", enabled: true }).success).toBe(false);
    });

    it("rejects key over 100 chars", () => {
      expect(flagInputSchema.safeParse({ key: "a".repeat(101), enabled: true }).success).toBe(false);
    });

    it("requires enabled field", () => {
      expect(flagInputSchema.safeParse({ key: "test_flag" }).success).toBe(false);
    });
  });

  describe("flagOverrideInputSchema", () => {
    it("accepts valid flag override input", () => {
      const result = flagOverrideInputSchema.safeParse({
        flagKey: "feature_flag",
        userId: 123,
        enabled: true,
      });
      expect(result.success).toBe(true);
    });

    it("accepts optional payload", () => {
      const result = flagOverrideInputSchema.safeParse({
        flagKey: "feature_flag",
        userId: 456,
        enabled: false,
        payload: { custom: "data" },
      });
      expect(result.success).toBe(true);
    });

    it("rejects non-positive userId", () => {
      expect(flagOverrideInputSchema.safeParse({
        flagKey: "feature_flag",
        userId: 0,
        enabled: true,
      }).success).toBe(false);

      expect(flagOverrideInputSchema.safeParse({
        flagKey: "feature_flag",
        userId: -1,
        enabled: true,
      }).success).toBe(false);
    });

    it("requires integer userId", () => {
      expect(flagOverrideInputSchema.safeParse({
        flagKey: "feature_flag",
        userId: 1.5,
        enabled: true,
      }).success).toBe(false);
    });
  });

  describe("userStatusInputSchema", () => {
    it("accepts valid user status input", () => {
      const result = userStatusInputSchema.safeParse({
        userId: 123,
        status: "ACTIVE",
      });
      expect(result.success).toBe(true);
    });

    it("accepts all valid statuses", () => {
      for (const status of ["ACTIVE", "DISABLED", "BANNED"]) {
        const result = userStatusInputSchema.safeParse({
          userId: 1,
          status,
        });
        expect(result.success).toBe(true);
      }
    });

    it("rejects invalid status", () => {
      expect(userStatusInputSchema.safeParse({
        userId: 1,
        status: "PENDING",
      }).success).toBe(false);
    });

    it("rejects non-positive userId", () => {
      expect(userStatusInputSchema.safeParse({
        userId: 0,
        status: "ACTIVE",
      }).success).toBe(false);
    });
  });
});
