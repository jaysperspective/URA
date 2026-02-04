// src/lib/schemas/__tests__/core.test.ts
import { describe, it, expect } from "vitest";
import {
  legacyInputSchema,
  structuredInputSchema,
  coreInputSchema,
  textWrappedInputSchema,
} from "../core";

describe("schemas/core", () => {
  describe("legacyInputSchema", () => {
    it("accepts valid legacy input", () => {
      const result = legacyInputSchema.safeParse({
        birth_datetime: "1990-06-15 14:30",
        tz_offset: "-05:00",
        as_of_date: "2024-01-15",
      });
      expect(result.success).toBe(true);
    });

    it("accepts legacy input with coordinates", () => {
      const result = legacyInputSchema.safeParse({
        birth_datetime: "1990-06-15 14:30",
        tz_offset: "+08:00",
        as_of_date: "2024-01-15",
        lat: 40.7128,
        lon: -74.006,
      });
      expect(result.success).toBe(true);
    });

    it("accepts legacy input with detail level", () => {
      const result = legacyInputSchema.safeParse({
        birth_datetime: "1990-06-15 14:30",
        tz_offset: "-05:00",
        as_of_date: "2024-01-15",
        detail: "full",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.detail).toBe("full");
      }
    });

    it("accepts includeBoundaries as boolean or string", () => {
      const boolResult = legacyInputSchema.safeParse({
        birth_datetime: "1990-06-15 14:30",
        tz_offset: "-05:00",
        as_of_date: "2024-01-15",
        includeBoundaries: true,
      });
      expect(boolResult.success).toBe(true);

      const stringResult = legacyInputSchema.safeParse({
        birth_datetime: "1990-06-15 14:30",
        tz_offset: "-05:00",
        as_of_date: "2024-01-15",
        includeBoundaries: "true",
      });
      expect(stringResult.success).toBe(true);
    });

    it("rejects invalid birth_datetime format", () => {
      expect(legacyInputSchema.safeParse({
        birth_datetime: "1990/06/15 14:30",
        tz_offset: "-05:00",
        as_of_date: "2024-01-15",
      }).success).toBe(false);
    });

    it("rejects invalid tz_offset format", () => {
      expect(legacyInputSchema.safeParse({
        birth_datetime: "1990-06-15 14:30",
        tz_offset: "EST",
        as_of_date: "2024-01-15",
      }).success).toBe(false);
    });
  });

  describe("structuredInputSchema", () => {
    it("accepts valid structured input with timezone", () => {
      const result = structuredInputSchema.safeParse({
        year: 1990,
        month: 6,
        day: 15,
        hour: 14,
        minute: 30,
        timezone: "America/New_York",
      });
      expect(result.success).toBe(true);
    });

    it("accepts structured input with tz_offset instead of timezone", () => {
      const result = structuredInputSchema.safeParse({
        year: 1990,
        month: 6,
        day: 15,
        hour: 14,
        minute: 30,
        tz_offset: "-05:00",
      });
      expect(result.success).toBe(true);
    });

    it("accepts structured input with coordinates", () => {
      const result = structuredInputSchema.safeParse({
        year: 1990,
        month: 6,
        day: 15,
        hour: 14,
        minute: 30,
        timezone: "America/Chicago",
        latitude: 41.8781,
        longitude: -87.6298,
      });
      expect(result.success).toBe(true);
    });

    it("accepts asOfDate in either naming convention", () => {
      const camelCase = structuredInputSchema.safeParse({
        year: 1990,
        month: 6,
        day: 15,
        hour: 14,
        minute: 30,
        asOfDate: "2024-01-15",
      });
      expect(camelCase.success).toBe(true);

      const snakeCase = structuredInputSchema.safeParse({
        year: 1990,
        month: 6,
        day: 15,
        hour: 14,
        minute: 30,
        as_of_date: "2024-01-15",
      });
      expect(snakeCase.success).toBe(true);
    });

    it("rejects invalid month", () => {
      expect(structuredInputSchema.safeParse({
        year: 1990,
        month: 13,
        day: 15,
        hour: 14,
        minute: 30,
      }).success).toBe(false);
    });

    it("rejects invalid hour", () => {
      expect(structuredInputSchema.safeParse({
        year: 1990,
        month: 6,
        day: 15,
        hour: 25,
        minute: 30,
      }).success).toBe(false);
    });
  });

  describe("coreInputSchema", () => {
    it("accepts legacy format", () => {
      const result = coreInputSchema.safeParse({
        birth_datetime: "1990-06-15 14:30",
        tz_offset: "-05:00",
        as_of_date: "2024-01-15",
      });
      expect(result.success).toBe(true);
    });

    it("accepts structured format", () => {
      const result = coreInputSchema.safeParse({
        year: 1990,
        month: 6,
        day: 15,
        hour: 14,
        minute: 30,
        timezone: "America/New_York",
      });
      expect(result.success).toBe(true);
    });

    it("rejects completely invalid input", () => {
      expect(coreInputSchema.safeParse({
        invalid: "data",
      }).success).toBe(false);
    });
  });

  describe("textWrappedInputSchema", () => {
    it("accepts valid text input", () => {
      const result = textWrappedInputSchema.safeParse({
        text: "key: value\nanother: data",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.text).toBe("key: value\nanother: data");
      }
    });

    it("rejects missing text field", () => {
      expect(textWrappedInputSchema.safeParse({}).success).toBe(false);
    });

    it("rejects non-string text", () => {
      expect(textWrappedInputSchema.safeParse({ text: 123 }).success).toBe(false);
    });
  });
});
