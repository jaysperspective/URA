// src/lib/schemas/__tests__/market.test.ts
import { describe, it, expect } from "vitest";
import {
  marketPriceInputSchema,
  marketCandleInputSchema,
  geocodeInputSchema,
  chartInputSchema,
  gannInputSchema,
  gannScanInputSchema,
  pivotScanInputSchema,
} from "../market";

describe("schemas/market", () => {
  describe("marketPriceInputSchema", () => {
    it("accepts valid stock symbol", () => {
      const result = marketPriceInputSchema.safeParse({ symbol: "AAPL" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.symbol).toBe("AAPL");
      }
    });

    it("transforms symbol to uppercase", () => {
      const result = marketPriceInputSchema.safeParse({ symbol: "aapl" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.symbol).toBe("AAPL");
      }
    });

    it("trims whitespace", () => {
      const result = marketPriceInputSchema.safeParse({ symbol: "  AAPL  " });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.symbol).toBe("AAPL");
      }
    });

    it("rejects empty symbol", () => {
      expect(marketPriceInputSchema.safeParse({ symbol: "" }).success).toBe(false);
    });

    it("rejects symbol over 20 chars", () => {
      expect(marketPriceInputSchema.safeParse({ symbol: "A".repeat(21) }).success).toBe(false);
    });
  });

  describe("marketCandleInputSchema", () => {
    it("accepts valid input", () => {
      const result = marketCandleInputSchema.safeParse({
        symbol: "AAPL",
        pivotISO: "2024-01-15T12:00:00Z",
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid datetime", () => {
      expect(marketCandleInputSchema.safeParse({
        symbol: "AAPL",
        pivotISO: "not a date",
      }).success).toBe(false);
    });
  });

  describe("geocodeInputSchema", () => {
    it("accepts valid query", () => {
      const result = geocodeInputSchema.safeParse({ q: "New York, NY" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.q).toBe("New York, NY");
      }
    });

    it("trims whitespace", () => {
      const result = geocodeInputSchema.safeParse({ q: "  Chicago, IL  " });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.q).toBe("Chicago, IL");
      }
    });

    it("rejects empty query", () => {
      expect(geocodeInputSchema.safeParse({ q: "" }).success).toBe(false);
      expect(geocodeInputSchema.safeParse({ q: "   " }).success).toBe(false);
    });

    it("rejects query over 500 chars", () => {
      expect(geocodeInputSchema.safeParse({ q: "a".repeat(501) }).success).toBe(false);
    });
  });

  describe("chartInputSchema", () => {
    it("accepts valid chart input", () => {
      const result = chartInputSchema.safeParse({
        year: 1990,
        month: 6,
        day: 15,
        hour: 14,
        minute: 30,
        latitude: 40.7128,
        longitude: -74.006,
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid coordinates", () => {
      expect(chartInputSchema.safeParse({
        year: 1990,
        month: 6,
        day: 15,
        hour: 14,
        minute: 30,
        latitude: 91,
        longitude: -74.006,
      }).success).toBe(false);
    });
  });

  describe("gannInputSchema", () => {
    it("accepts valid market mode input", () => {
      const result = gannInputSchema.safeParse({
        mode: "market",
        anchor: 100,
      });
      expect(result.success).toBe(true);
    });

    it("accepts market mode with optional fields", () => {
      const result = gannInputSchema.safeParse({
        mode: "market",
        anchor: 150.5,
        tickSize: 0.01,
        includeDownside: false,
        cycleDays: 180,
        symbol: "AAPL",
      });
      expect(result.success).toBe(true);
    });

    it("accepts valid personal mode input", () => {
      const result = gannInputSchema.safeParse({
        mode: "personal",
        anchorDateTime: "2024-01-15T12:00:00Z",
      });
      expect(result.success).toBe(true);
    });

    it("rejects market mode without anchor", () => {
      expect(gannInputSchema.safeParse({
        mode: "market",
      }).success).toBe(false);
    });

    it("rejects personal mode without anchorDateTime", () => {
      expect(gannInputSchema.safeParse({
        mode: "personal",
      }).success).toBe(false);
    });

    it("rejects non-positive anchor", () => {
      expect(gannInputSchema.safeParse({
        mode: "market",
        anchor: 0,
      }).success).toBe(false);

      expect(gannInputSchema.safeParse({
        mode: "market",
        anchor: -100,
      }).success).toBe(false);
    });
  });

  describe("gannScanInputSchema", () => {
    it("accepts valid input with string symbols", () => {
      const result = gannScanInputSchema.safeParse({
        symbols: "AAPL,GOOGL,MSFT",
        pivotISO: "2024-01-15T12:00:00Z",
        cycleDays: 365,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.symbols).toEqual(["AAPL", "GOOGL", "MSFT"]);
      }
    });

    it("accepts valid input with array symbols", () => {
      const result = gannScanInputSchema.safeParse({
        symbols: ["AAPL", "GOOGL"],
        pivotISO: "2024-01-15T12:00:00Z",
        cycleDays: 365,
      });
      expect(result.success).toBe(true);
    });

    it("applies default values", () => {
      const result = gannScanInputSchema.safeParse({
        symbols: ["AAPL"],
        pivotISO: "2024-01-15T12:00:00Z",
        cycleDays: 365,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tolDeg).toBe(3);
        expect(result.data.anchorSource).toBe("low");
        expect(result.data.tickSize).toBe(1);
        expect(result.data.closestN).toBe(10);
        expect(result.data.maxSymbols).toBe(50);
      }
    });

    it("rejects tolDeg > 45", () => {
      expect(gannScanInputSchema.safeParse({
        symbols: ["AAPL"],
        pivotISO: "2024-01-15T12:00:00Z",
        cycleDays: 365,
        tolDeg: 46,
      }).success).toBe(false);
    });
  });

  describe("pivotScanInputSchema", () => {
    it("accepts valid input", () => {
      const result = pivotScanInputSchema.safeParse({
        symbol: "AAPL",
      });
      expect(result.success).toBe(true);
    });

    it("applies default values", () => {
      const result = pivotScanInputSchema.safeParse({
        symbol: "AAPL",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.timeframe).toBe("1d");
        expect(result.data.lookback).toBe(100);
      }
    });

    it("accepts all valid timeframes", () => {
      for (const timeframe of ["1d", "4h", "1h"]) {
        const result = pivotScanInputSchema.safeParse({
          symbol: "AAPL",
          timeframe,
        });
        expect(result.success).toBe(true);
      }
    });

    it("rejects invalid timeframe", () => {
      expect(pivotScanInputSchema.safeParse({
        symbol: "AAPL",
        timeframe: "1m",
      }).success).toBe(false);
    });

    it("rejects lookback out of range", () => {
      expect(pivotScanInputSchema.safeParse({
        symbol: "AAPL",
        lookback: 5,
      }).success).toBe(false);

      expect(pivotScanInputSchema.safeParse({
        symbol: "AAPL",
        lookback: 501,
      }).success).toBe(false);
    });
  });
});
