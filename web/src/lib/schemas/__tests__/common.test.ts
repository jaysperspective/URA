// src/lib/schemas/__tests__/common.test.ts
import { describe, it, expect } from "vitest";
import {
  latitudeSchema,
  longitudeSchema,
  coordinatesSchema,
  birthComponentsSchema,
  tzOffsetSchema,
  dateYMDSchema,
  birthDatetimeSchema,
  timezoneSchema,
  detailLevelSchema,
  coerceNumber,
  optionalCoerceNumber,
  coerceBoolean,
  optionalCoerceBoolean,
} from "../common";

describe("schemas/common", () => {
  describe("latitudeSchema", () => {
    it("accepts valid latitudes", () => {
      expect(latitudeSchema.safeParse(0).success).toBe(true);
      expect(latitudeSchema.safeParse(45.5).success).toBe(true);
      expect(latitudeSchema.safeParse(-45.5).success).toBe(true);
      expect(latitudeSchema.safeParse(90).success).toBe(true);
      expect(latitudeSchema.safeParse(-90).success).toBe(true);
    });

    it("rejects latitudes > 90", () => {
      expect(latitudeSchema.safeParse(91).success).toBe(false);
      expect(latitudeSchema.safeParse(180).success).toBe(false);
    });

    it("rejects latitudes < -90", () => {
      expect(latitudeSchema.safeParse(-91).success).toBe(false);
      expect(latitudeSchema.safeParse(-180).success).toBe(false);
    });

    it("rejects non-numbers", () => {
      expect(latitudeSchema.safeParse("45").success).toBe(false);
      expect(latitudeSchema.safeParse(null).success).toBe(false);
    });
  });

  describe("longitudeSchema", () => {
    it("accepts valid longitudes", () => {
      expect(longitudeSchema.safeParse(0).success).toBe(true);
      expect(longitudeSchema.safeParse(180).success).toBe(true);
      expect(longitudeSchema.safeParse(-180).success).toBe(true);
      expect(longitudeSchema.safeParse(90).success).toBe(true);
    });

    it("rejects longitudes > 180", () => {
      expect(longitudeSchema.safeParse(181).success).toBe(false);
      expect(longitudeSchema.safeParse(360).success).toBe(false);
    });

    it("rejects longitudes < -180", () => {
      expect(longitudeSchema.safeParse(-181).success).toBe(false);
    });
  });

  describe("coordinatesSchema", () => {
    it("accepts valid coordinates", () => {
      const result = coordinatesSchema.safeParse({ lat: 40.7128, lon: -74.006 });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.lat).toBe(40.7128);
        expect(result.data.lon).toBe(-74.006);
      }
    });

    it("rejects missing lat", () => {
      expect(coordinatesSchema.safeParse({ lon: -74.006 }).success).toBe(false);
    });

    it("rejects missing lon", () => {
      expect(coordinatesSchema.safeParse({ lat: 40.7128 }).success).toBe(false);
    });

    it("rejects out-of-range coordinates", () => {
      expect(coordinatesSchema.safeParse({ lat: 91, lon: 0 }).success).toBe(false);
      expect(coordinatesSchema.safeParse({ lat: 0, lon: 181 }).success).toBe(false);
    });
  });

  describe("birthComponentsSchema", () => {
    it("accepts valid birth components", () => {
      const result = birthComponentsSchema.safeParse({
        year: 1990,
        month: 6,
        day: 15,
        hour: 14,
        minute: 30,
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid month", () => {
      expect(birthComponentsSchema.safeParse({
        year: 1990, month: 0, day: 15, hour: 14, minute: 30,
      }).success).toBe(false);
      expect(birthComponentsSchema.safeParse({
        year: 1990, month: 13, day: 15, hour: 14, minute: 30,
      }).success).toBe(false);
    });

    it("rejects invalid day", () => {
      expect(birthComponentsSchema.safeParse({
        year: 1990, month: 6, day: 0, hour: 14, minute: 30,
      }).success).toBe(false);
      expect(birthComponentsSchema.safeParse({
        year: 1990, month: 6, day: 32, hour: 14, minute: 30,
      }).success).toBe(false);
    });

    it("rejects invalid hour", () => {
      expect(birthComponentsSchema.safeParse({
        year: 1990, month: 6, day: 15, hour: -1, minute: 30,
      }).success).toBe(false);
      expect(birthComponentsSchema.safeParse({
        year: 1990, month: 6, day: 15, hour: 24, minute: 30,
      }).success).toBe(false);
    });

    it("rejects invalid minute", () => {
      expect(birthComponentsSchema.safeParse({
        year: 1990, month: 6, day: 15, hour: 14, minute: -1,
      }).success).toBe(false);
      expect(birthComponentsSchema.safeParse({
        year: 1990, month: 6, day: 15, hour: 14, minute: 60,
      }).success).toBe(false);
    });

    it("requires integers", () => {
      expect(birthComponentsSchema.safeParse({
        year: 1990.5, month: 6, day: 15, hour: 14, minute: 30,
      }).success).toBe(false);
    });
  });

  describe("tzOffsetSchema", () => {
    it("accepts valid positive offset", () => {
      expect(tzOffsetSchema.safeParse("+05:00").success).toBe(true);
      expect(tzOffsetSchema.safeParse("+12:30").success).toBe(true);
    });

    it("accepts valid negative offset", () => {
      expect(tzOffsetSchema.safeParse("-08:00").success).toBe(true);
      expect(tzOffsetSchema.safeParse("-05:30").success).toBe(true);
    });

    it("rejects invalid format", () => {
      expect(tzOffsetSchema.safeParse("5:00").success).toBe(false);
      expect(tzOffsetSchema.safeParse("EST").success).toBe(false);
      expect(tzOffsetSchema.safeParse("+5:00").success).toBe(false);
      expect(tzOffsetSchema.safeParse("+05:0").success).toBe(false);
    });
  });

  describe("dateYMDSchema", () => {
    it("accepts valid date format", () => {
      expect(dateYMDSchema.safeParse("2024-01-15").success).toBe(true);
      expect(dateYMDSchema.safeParse("1990-12-31").success).toBe(true);
    });

    it("rejects invalid format", () => {
      expect(dateYMDSchema.safeParse("01-15-2024").success).toBe(false);
      expect(dateYMDSchema.safeParse("2024/01/15").success).toBe(false);
      expect(dateYMDSchema.safeParse("2024-1-15").success).toBe(false);
    });
  });

  describe("birthDatetimeSchema", () => {
    it("accepts valid format", () => {
      expect(birthDatetimeSchema.safeParse("1990-06-15 14:30").success).toBe(true);
      expect(birthDatetimeSchema.safeParse("2024-01-01 00:00").success).toBe(true);
    });

    it("rejects invalid format", () => {
      expect(birthDatetimeSchema.safeParse("1990-06-15T14:30").success).toBe(false);
      expect(birthDatetimeSchema.safeParse("1990-06-15").success).toBe(false);
    });
  });

  describe("timezoneSchema", () => {
    it("accepts valid timezone strings", () => {
      expect(timezoneSchema.safeParse("America/New_York").success).toBe(true);
      expect(timezoneSchema.safeParse("UTC").success).toBe(true);
    });

    it("rejects empty string", () => {
      expect(timezoneSchema.safeParse("").success).toBe(false);
    });
  });

  describe("detailLevelSchema", () => {
    it("accepts 'quick' and 'full'", () => {
      expect(detailLevelSchema.safeParse("quick").success).toBe(true);
      expect(detailLevelSchema.safeParse("full").success).toBe(true);
    });

    it("accepts undefined", () => {
      expect(detailLevelSchema.safeParse(undefined).success).toBe(true);
    });

    it("rejects invalid values", () => {
      expect(detailLevelSchema.safeParse("detailed").success).toBe(false);
    });
  });

  describe("coerceNumber", () => {
    it("parses numbers", () => {
      expect(coerceNumber.safeParse(42).data).toBe(42);
    });

    it("coerces strings to numbers", () => {
      expect(coerceNumber.safeParse("42").data).toBe(42);
      expect(coerceNumber.safeParse("3.14").data).toBe(3.14);
    });

    it("rejects non-numeric strings", () => {
      expect(coerceNumber.safeParse("abc").success).toBe(false);
    });
  });

  describe("coerceBoolean", () => {
    it("passes through booleans", () => {
      expect(coerceBoolean.safeParse(true).data).toBe(true);
      expect(coerceBoolean.safeParse(false).data).toBe(false);
    });

    it("coerces 'true' string to true", () => {
      expect(coerceBoolean.safeParse("true").data).toBe(true);
      expect(coerceBoolean.safeParse("TRUE").data).toBe(true);
    });

    it("coerces other strings to false", () => {
      expect(coerceBoolean.safeParse("false").data).toBe(false);
      expect(coerceBoolean.safeParse("no").data).toBe(false);
    });
  });

  describe("optionalCoerceBoolean", () => {
    it("returns undefined for undefined", () => {
      expect(optionalCoerceBoolean.safeParse(undefined).data).toBe(undefined);
    });

    it("returns undefined for null", () => {
      expect(optionalCoerceBoolean.safeParse(null).data).toBe(undefined);
    });

    it("coerces valid values", () => {
      expect(optionalCoerceBoolean.safeParse(true).data).toBe(true);
      expect(optionalCoerceBoolean.safeParse("true").data).toBe(true);
    });
  });
});
