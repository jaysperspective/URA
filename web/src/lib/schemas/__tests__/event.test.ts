// src/lib/schemas/__tests__/event.test.ts
import { describe, it, expect } from "vitest";
import {
  eventTypeSchema,
  severitySchema,
  metaSchema,
  eventInputSchema,
} from "../event";

describe("schemas/event", () => {
  describe("eventTypeSchema", () => {
    it("accepts predefined event types", () => {
      const types = ["pageview", "feature", "error", "timing", "api", "interaction"];
      for (const type of types) {
        const result = eventTypeSchema.safeParse(type);
        expect(result.success).toBe(true);
      }
    });

    it("accepts custom event types up to 40 chars", () => {
      const result = eventTypeSchema.safeParse("custom_event_type");
      expect(result.success).toBe(true);
    });

    it("rejects event types over 40 chars", () => {
      expect(eventTypeSchema.safeParse("a".repeat(41)).success).toBe(false);
    });
  });

  describe("severitySchema", () => {
    it("accepts valid severity levels", () => {
      expect(severitySchema.safeParse("info").success).toBe(true);
      expect(severitySchema.safeParse("warn").success).toBe(true);
      expect(severitySchema.safeParse("error").success).toBe(true);
    });

    it("accepts undefined", () => {
      expect(severitySchema.safeParse(undefined).success).toBe(true);
    });

    it("rejects invalid severity", () => {
      expect(severitySchema.safeParse("debug").success).toBe(false);
    });
  });

  describe("metaSchema", () => {
    it("accepts simple key-value pairs", () => {
      const result = metaSchema.safeParse({
        userId: "12345",
        count: 42,
        active: true,
      });
      expect(result.success).toBe(true);
    });

    it("accepts nested objects", () => {
      const result = metaSchema.safeParse({
        user: {
          id: "12345",
          role: "admin",
        },
        config: {
          enabled: true,
        },
      });
      expect(result.success).toBe(true);
    });

    it("accepts arrays", () => {
      const result = metaSchema.safeParse({
        tags: ["tag1", "tag2", "tag3"],
        numbers: [1, 2, 3],
      });
      expect(result.success).toBe(true);
    });

    it("accepts null values", () => {
      const result = metaSchema.safeParse({
        optional: null,
      });
      expect(result.success).toBe(true);
    });

    it("accepts undefined (optional)", () => {
      expect(metaSchema.safeParse(undefined).success).toBe(true);
    });

    it("rejects keys over 100 chars", () => {
      const longKey = "a".repeat(101);
      expect(metaSchema.safeParse({ [longKey]: "value" }).success).toBe(false);
    });
  });

  describe("eventInputSchema", () => {
    it("accepts minimal valid input", () => {
      const result = eventInputSchema.safeParse({
        type: "pageview",
      });
      expect(result.success).toBe(true);
    });

    it("accepts full event input", () => {
      const result = eventInputSchema.safeParse({
        type: "api",
        name: "fetch_user_profile",
        path: "/api/profile",
        severity: "info",
        sessionToken: "session_abc123",
        durationMs: 150,
        statusCode: 200,
        meta: {
          userId: "user_123",
          cached: false,
        },
      });
      expect(result.success).toBe(true);
    });

    it("accepts error events", () => {
      const result = eventInputSchema.safeParse({
        type: "error",
        name: "api_failure",
        severity: "error",
        statusCode: 500,
        meta: {
          message: "Internal server error",
          stack: "Error at line 42...",
        },
      });
      expect(result.success).toBe(true);
    });

    it("accepts timing events", () => {
      const result = eventInputSchema.safeParse({
        type: "timing",
        name: "page_load",
        durationMs: 2500,
        path: "/dashboard",
      });
      expect(result.success).toBe(true);
    });

    it("rejects empty type", () => {
      expect(eventInputSchema.safeParse({
        type: "",
      }).success).toBe(false);
    });

    it("rejects type over 40 chars", () => {
      expect(eventInputSchema.safeParse({
        type: "a".repeat(41),
      }).success).toBe(false);
    });

    it("rejects name over 120 chars", () => {
      expect(eventInputSchema.safeParse({
        type: "feature",
        name: "a".repeat(121),
      }).success).toBe(false);
    });

    it("rejects path over 200 chars", () => {
      expect(eventInputSchema.safeParse({
        type: "pageview",
        path: "/" + "a".repeat(200),
      }).success).toBe(false);
    });

    it("rejects negative durationMs", () => {
      expect(eventInputSchema.safeParse({
        type: "timing",
        durationMs: -100,
      }).success).toBe(false);
    });

    it("rejects non-integer durationMs", () => {
      expect(eventInputSchema.safeParse({
        type: "timing",
        durationMs: 150.5,
      }).success).toBe(false);
    });
  });
});
