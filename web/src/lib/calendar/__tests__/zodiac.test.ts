// src/lib/calendar/__tests__/zodiac.test.ts
import { describe, it, expect } from "vitest";
import { SIGNS, angleToSign, fmtSignPos, nextSignBoundary } from "../zodiac";

describe("zodiac", () => {
  describe("SIGNS constant", () => {
    it("has 12 signs", () => {
      expect(SIGNS).toHaveLength(12);
    });

    it("starts with Aries", () => {
      expect(SIGNS[0]).toBe("Aries");
    });

    it("ends with Pisces", () => {
      expect(SIGNS[11]).toBe("Pisces");
    });
  });

  describe("angleToSign", () => {
    it("returns Aries for 0-30 degrees", () => {
      expect(angleToSign(0).sign).toBe("Aries");
      expect(angleToSign(15).sign).toBe("Aries");
      expect(angleToSign(29.9).sign).toBe("Aries");
    });

    it("returns Taurus for 30-60 degrees", () => {
      expect(angleToSign(30).sign).toBe("Taurus");
      expect(angleToSign(45).sign).toBe("Taurus");
    });

    it("returns Pisces for 330-360 degrees", () => {
      expect(angleToSign(330).sign).toBe("Pisces");
      expect(angleToSign(350).sign).toBe("Pisces");
    });

    it("handles wrap-around at 360", () => {
      expect(angleToSign(360).sign).toBe("Aries"); // 360 -> 0
      expect(angleToSign(390).sign).toBe("Taurus"); // 390 -> 30
      expect(angleToSign(720).sign).toBe("Aries"); // 720 -> 0
    });

    it("handles negative angles", () => {
      expect(angleToSign(-30).sign).toBe("Pisces");
      expect(angleToSign(-60).sign).toBe("Aquarius");
    });

    it("calculates degrees within sign correctly", () => {
      const result = angleToSign(45);
      expect(result.sign).toBe("Taurus");
      expect(result.deg).toBe(15);
    });

    it("calculates minutes correctly", () => {
      const result = angleToSign(45.5);
      expect(result.deg).toBe(15);
      expect(result.min).toBe(30);
    });
  });

  describe("fmtSignPos", () => {
    it("formats position correctly", () => {
      expect(fmtSignPos(0)).toBe("0° Ari 00'");
      expect(fmtSignPos(45.5)).toBe("15° Tau 30'");
    });

    it("pads minutes with leading zero", () => {
      expect(fmtSignPos(30.05)).toMatch(/0\d'/);
    });
  });

  describe("nextSignBoundary", () => {
    it("returns next 30-degree boundary", () => {
      expect(nextSignBoundary(0)).toBe(30);
      expect(nextSignBoundary(15)).toBe(30);
      expect(nextSignBoundary(45)).toBe(60);
    });

    it("wraps around at 360", () => {
      expect(nextSignBoundary(330)).toBe(0);
      expect(nextSignBoundary(350)).toBe(0);
    });

    it("handles negative angles", () => {
      expect(nextSignBoundary(-15)).toBe(0);
    });

    it("returns correct boundary at exact boundaries", () => {
      expect(nextSignBoundary(30)).toBe(60);
      expect(nextSignBoundary(60)).toBe(90);
    });
  });
});
