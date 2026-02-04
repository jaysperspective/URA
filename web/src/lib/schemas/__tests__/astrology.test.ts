// src/lib/schemas/__tests__/astrology.test.ts
import { describe, it, expect } from "vitest";
import {
  synthesizeInputSchema,
  natalInputSchema,
  lensSchema,
  modeSchema,
} from "../astrology";

describe("schemas/astrology", () => {
  describe("lensSchema", () => {
    it("accepts all valid lenses", () => {
      const validLenses = [
        "general",
        "relationships",
        "work",
        "health",
        "creativity",
        "spiritual",
        "shadow",
        "growth",
      ];

      for (const lens of validLenses) {
        expect(lensSchema.safeParse(lens).success).toBe(true);
      }
    });

    it("rejects invalid lens", () => {
      expect(lensSchema.safeParse("career").success).toBe(false);
      expect(lensSchema.safeParse("").success).toBe(false);
    });
  });

  describe("modeSchema", () => {
    it("accepts all valid modes", () => {
      expect(modeSchema.safeParse("placement").success).toBe(true);
      expect(modeSchema.safeParse("pair").success).toBe(true);
      expect(modeSchema.safeParse("mini_chart").success).toBe(true);
    });

    it("rejects invalid mode", () => {
      expect(modeSchema.safeParse("chart").success).toBe(false);
    });
  });

  describe("synthesizeInputSchema", () => {
    it("accepts valid placement mode (1 key)", () => {
      const result = synthesizeInputSchema.safeParse({
        version: "1.0",
        mode: "placement",
        keys: ["sun|aries"],
      });
      expect(result.success).toBe(true);
    });

    it("accepts valid pair mode (2 keys)", () => {
      const result = synthesizeInputSchema.safeParse({
        version: "1.0",
        mode: "pair",
        keys: ["sun|aries", "moon|cancer"],
      });
      expect(result.success).toBe(true);
    });

    it("accepts valid mini_chart mode (3-6 keys)", () => {
      const result = synthesizeInputSchema.safeParse({
        version: "1.0",
        mode: "mini_chart",
        keys: ["sun|aries", "moon|cancer", "mercury|gemini"],
      });
      expect(result.success).toBe(true);
    });

    it("accepts optional fields", () => {
      const result = synthesizeInputSchema.safeParse({
        version: "1.0",
        mode: "placement",
        keys: ["sun|aries"],
        lens: "relationships",
        question: "What about love?",
        output: {
          format: "deep",
          maxBullets: 3,
          includeJournalPrompts: false,
        },
      });
      expect(result.success).toBe(true);
    });

    it("rejects wrong version", () => {
      const result = synthesizeInputSchema.safeParse({
        version: "2.0",
        mode: "placement",
        keys: ["sun|aries"],
      });
      expect(result.success).toBe(false);
    });

    it("rejects placement mode with wrong key count", () => {
      const result = synthesizeInputSchema.safeParse({
        version: "1.0",
        mode: "placement",
        keys: ["sun|aries", "moon|cancer"],
      });
      expect(result.success).toBe(false);
    });

    it("rejects pair mode with wrong key count", () => {
      const result = synthesizeInputSchema.safeParse({
        version: "1.0",
        mode: "pair",
        keys: ["sun|aries"],
      });
      expect(result.success).toBe(false);
    });

    it("rejects mini_chart mode with < 3 keys", () => {
      const result = synthesizeInputSchema.safeParse({
        version: "1.0",
        mode: "mini_chart",
        keys: ["sun|aries", "moon|cancer"],
      });
      expect(result.success).toBe(false);
    });

    it("rejects mini_chart mode with > 6 keys", () => {
      const result = synthesizeInputSchema.safeParse({
        version: "1.0",
        mode: "mini_chart",
        keys: ["a", "b", "c", "d", "e", "f", "g"],
      });
      expect(result.success).toBe(false);
    });

    it("rejects empty keys array", () => {
      const result = synthesizeInputSchema.safeParse({
        version: "1.0",
        mode: "placement",
        keys: [],
      });
      expect(result.success).toBe(false);
    });

    it("rejects question over 500 chars", () => {
      const result = synthesizeInputSchema.safeParse({
        version: "1.0",
        mode: "placement",
        keys: ["sun|aries"],
        question: "x".repeat(501),
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid output format", () => {
      const result = synthesizeInputSchema.safeParse({
        version: "1.0",
        mode: "placement",
        keys: ["sun|aries"],
        output: { format: "verbose" },
      });
      expect(result.success).toBe(false);
    });
  });

  describe("natalInputSchema", () => {
    it("accepts valid natal input", () => {
      const result = natalInputSchema.safeParse({
        birthDate: "1990-06-15",
        birthTime: "14:30",
      });
      expect(result.success).toBe(true);
    });

    it("accepts optional birthPlace", () => {
      const result = natalInputSchema.safeParse({
        birthDate: "1990-06-15",
        birthTime: "14:30",
        birthPlace: "New York, NY",
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid date format", () => {
      const result = natalInputSchema.safeParse({
        birthDate: "06-15-1990",
        birthTime: "14:30",
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid time format", () => {
      const result = natalInputSchema.safeParse({
        birthDate: "1990-06-15",
        birthTime: "2:30 PM",
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing required fields", () => {
      expect(natalInputSchema.safeParse({ birthDate: "1990-06-15" }).success).toBe(false);
      expect(natalInputSchema.safeParse({ birthTime: "14:30" }).success).toBe(false);
    });
  });
});
