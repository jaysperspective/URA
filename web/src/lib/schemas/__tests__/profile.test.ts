// src/lib/schemas/__tests__/profile.test.ts
import { describe, it, expect } from "vitest";
import {
  confidenceSchema,
  briefContextSchema,
  sabianSchema,
  briefOutputConfigSchema,
  briefConstraintsSchema,
  briefInputSchema,
} from "../profile";

describe("schemas/profile", () => {
  describe("confidenceSchema", () => {
    it("accepts valid confidence levels", () => {
      expect(confidenceSchema.safeParse("low").success).toBe(true);
      expect(confidenceSchema.safeParse("medium").success).toBe(true);
      expect(confidenceSchema.safeParse("high").success).toBe(true);
    });

    it("rejects invalid confidence level", () => {
      expect(confidenceSchema.safeParse("very_high").success).toBe(false);
    });
  });

  describe("briefContextSchema", () => {
    it("accepts valid context object", () => {
      const result = briefContextSchema.safeParse({
        season: "spring",
        phaseId: 3,
        cyclePosDeg: 45.5,
        degIntoPhase: 12.3,
        phaseProgress01: 0.75,
        phaseHeader: "Waxing Crescent",
        phaseOneLine: "Building momentum",
        phaseDescription: "A time of growth and development",
        phaseActionHint: "Take initiative",
        journalPrompt: "What seeds are you planting?",
        journalHelper: "Reflect on new beginnings",
        currentSun: "Aries",
        lunation: "New Moon in Pisces",
        progressed: "Sun in Taurus",
        asOf: "2024-01-15",
      });
      expect(result.success).toBe(true);
    });

    it("accepts partial context", () => {
      const result = briefContextSchema.safeParse({
        season: "winter",
        phaseId: 1,
      });
      expect(result.success).toBe(true);
    });

    it("accepts empty object", () => {
      const result = briefContextSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("accepts undefined (optional)", () => {
      expect(briefContextSchema.safeParse(undefined).success).toBe(true);
    });
  });

  describe("sabianSchema", () => {
    it("accepts valid sabian data", () => {
      const result = sabianSchema.safeParse({
        key: "aries-1",
        symbol: "A woman rises out of water...",
        signal: "Emergence",
        shadow: "Resistance to change",
        directive: "Embrace new beginnings",
        practice: "Morning meditation",
        journal: "What is emerging in your life?",
        tags: ["water", "feminine", "emergence"],
      });
      expect(result.success).toBe(true);
    });

    it("accepts partial sabian data", () => {
      const result = sabianSchema.safeParse({
        key: "taurus-15",
        symbol: "A man muffled up...",
      });
      expect(result.success).toBe(true);
    });

    it("accepts undefined (optional)", () => {
      expect(sabianSchema.safeParse(undefined).success).toBe(true);
    });
  });

  describe("briefOutputConfigSchema", () => {
    it("accepts valid output config", () => {
      const result = briefOutputConfigSchema.safeParse({
        maxDoNow: 4,
        maxAvoid: 2,
        maxSentencesMeaning: 5,
      });
      expect(result.success).toBe(true);
    });

    it("applies default values", () => {
      const result = briefOutputConfigSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data?.maxDoNow).toBe(3);
        expect(result.data?.maxAvoid).toBe(2);
        expect(result.data?.maxSentencesMeaning).toBe(4);
      }
    });

    it("rejects maxDoNow out of range", () => {
      expect(briefOutputConfigSchema.safeParse({ maxDoNow: 0 }).success).toBe(false);
      expect(briefOutputConfigSchema.safeParse({ maxDoNow: 6 }).success).toBe(false);
    });

    it("rejects maxAvoid out of range", () => {
      expect(briefOutputConfigSchema.safeParse({ maxAvoid: -1 }).success).toBe(false);
      expect(briefOutputConfigSchema.safeParse({ maxAvoid: 4 }).success).toBe(false);
    });

    it("rejects maxSentencesMeaning out of range", () => {
      expect(briefOutputConfigSchema.safeParse({ maxSentencesMeaning: 1 }).success).toBe(false);
      expect(briefOutputConfigSchema.safeParse({ maxSentencesMeaning: 7 }).success).toBe(false);
    });

    it("accepts undefined (optional)", () => {
      expect(briefOutputConfigSchema.safeParse(undefined).success).toBe(true);
    });
  });

  describe("briefConstraintsSchema", () => {
    it("accepts valid constraints", () => {
      const result = briefConstraintsSchema.safeParse({
        noPrediction: true,
        noNewClaims: false,
        citeInputs: true,
      });
      expect(result.success).toBe(true);
    });

    it("accepts partial constraints", () => {
      const result = briefConstraintsSchema.safeParse({
        noPrediction: true,
      });
      expect(result.success).toBe(true);
    });

    it("accepts undefined (optional)", () => {
      expect(briefConstraintsSchema.safeParse(undefined).success).toBe(true);
    });
  });

  describe("briefInputSchema", () => {
    it("accepts minimal valid input", () => {
      const result = briefInputSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.timezone).toBe("America/New_York");
      }
    });

    it("accepts full brief input", () => {
      const result = briefInputSchema.safeParse({
        timezone: "Europe/London",
        context: {
          season: "autumn",
          phaseId: 5,
          phaseHeader: "Full Moon",
        },
        sabian: {
          key: "libra-22",
          symbol: "A child giving birds a drink...",
        },
        dayKey: "2024-01-15",
        output: {
          maxDoNow: 4,
          maxAvoid: 1,
        },
        constraints: {
          noPrediction: true,
          citeInputs: true,
        },
      });
      expect(result.success).toBe(true);
    });

    it("accepts different timezones", () => {
      const timezones = [
        "America/Los_Angeles",
        "Asia/Tokyo",
        "Europe/Paris",
        "Australia/Sydney",
      ];
      for (const tz of timezones) {
        const result = briefInputSchema.safeParse({ timezone: tz });
        expect(result.success).toBe(true);
      }
    });

    it("accepts any string as timezone (basic validation only)", () => {
      // Note: timezoneSchema only validates string length, not IANA validity
      // Runtime timezone validation happens in the route handlers
      const result = briefInputSchema.safeParse({
        timezone: "Any/String",
      });
      expect(result.success).toBe(true);
    });

    it("rejects empty timezone", () => {
      expect(briefInputSchema.safeParse({
        timezone: "",
      }).success).toBe(false);
    });

    it("uses default timezone when not provided", () => {
      const result = briefInputSchema.safeParse({
        context: { season: "summer" },
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.timezone).toBe("America/New_York");
      }
    });
  });
});
