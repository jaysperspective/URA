// Zod schemas for market-related endpoints
import { z } from "zod";
import { birthComponentsSchema, latitudeSchema, longitudeSchema } from "./common";

/**
 * Schema for /api/market-price (POST)
 * Fetch current price for a stock or crypto symbol.
 */
export const marketPriceInputSchema = z.object({
  symbol: z.string().min(1).max(20).transform((s) => s.trim().toUpperCase()),
});

/**
 * Schema for /api/market-candle (POST)
 * Fetch OHLCV candle data for a symbol at a specific time.
 */
export const marketCandleInputSchema = z.object({
  symbol: z.string().min(1).max(20).transform((s) => s.trim().toUpperCase()),
  pivotISO: z.string().datetime({ message: "pivotISO must be a valid ISO datetime" }),
});

/**
 * Schema for /api/geocode (POST)
 * Geocode a location query to coordinates.
 */
export const geocodeInputSchema = z.object({
  q: z.string().max(500).transform((s) => s.trim()).refine((s) => s.length > 0, {
    message: "Query cannot be empty",
  }),
});

/**
 * Schema for /api/chart (POST)
 * Calculate a chart for given birth data.
 */
export const chartInputSchema = birthComponentsSchema.extend({
  latitude: latitudeSchema,
  longitude: longitudeSchema,
});

/**
 * Gann calculation modes.
 */
export const gannModeSchema = z.enum(["market", "personal"]);

/**
 * Gann angle presets.
 */
export const gannAnglesSchema = z.array(z.number()).optional();

/**
 * Schema for /api/gann (POST)
 * Calculate Gann angles for market or personal analysis.
 */
export const gannInputSchema = z.discriminatedUnion("mode", [
  // Market mode
  z.object({
    mode: z.literal("market"),
    anchor: z.number().positive(),
    tickSize: z.number().positive().optional().default(1),
    includeDownside: z.boolean().optional().default(true),
    pivotDateTime: z.string().optional(),
    cycleDays: z.number().positive().optional().default(365),
    symbol: z.string().max(20).optional(),
    angles: gannAnglesSchema,
  }),
  // Personal mode
  z.object({
    mode: z.literal("personal"),
    anchorDateTime: z.string(),
    cycleDays: z.number().positive().optional().default(365),
    angles: gannAnglesSchema,
  }),
]);

/**
 * Anchor source for gann scan.
 */
export const anchorSourceSchema = z.enum(["low", "high", "close", "open"]);

/**
 * Schema for /api/gann-scan (POST)
 * Scan multiple symbols for Gann angle alignments.
 */
export const gannScanInputSchema = z.object({
  symbols: z.union([
    z.string().transform((s) => s.split(",").map((x) => x.trim())),
    z.array(z.string()),
  ]),
  pivotISO: z.string(),
  cycleDays: z.number().positive(),
  tolDeg: z.number().min(0).max(45).optional().default(3),
  anchorSource: anchorSourceSchema.optional().default("low"),
  tickSize: z.number().positive().optional().default(1),
  closestN: z.number().int().min(1).max(50).optional().default(10),
  maxSymbols: z.number().int().min(1).max(100).optional().default(50),
});

/**
 * Timeframe for pivot scan.
 */
export const pivotTimeframeSchema = z.enum(["1d", "4h", "1h"]);

/**
 * Schema for /api/pivot-scan (POST)
 * Scan for pivot points in price data.
 */
export const pivotScanInputSchema = z.object({
  symbol: z.string().min(1).max(20),
  timeframe: pivotTimeframeSchema.optional().default("1d"),
  lookback: z.number().int().min(10).max(500).optional().default(100),
});

/**
 * Schema for /api/asc-year (POST)
 * Calculate ascendant year cycle.
 */
export const ascYearInputSchema = birthComponentsSchema.extend({
  lat: latitudeSchema.optional(),
  lon: longitudeSchema.optional(),
  latitude: latitudeSchema.optional(),
  longitude: longitudeSchema.optional(),
  timezone: z.string().optional(),
  asOfDate: z.string().optional(),
});

export type MarketPriceInput = z.infer<typeof marketPriceInputSchema>;
export type MarketCandleInput = z.infer<typeof marketCandleInputSchema>;
export type GeocodeInput = z.infer<typeof geocodeInputSchema>;
export type ChartInput = z.infer<typeof chartInputSchema>;
export type GannInput = z.infer<typeof gannInputSchema>;
export type GannScanInput = z.infer<typeof gannScanInputSchema>;
export type PivotScanInput = z.infer<typeof pivotScanInputSchema>;
export type AscYearInput = z.infer<typeof ascYearInputSchema>;
