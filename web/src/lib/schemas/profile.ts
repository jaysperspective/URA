// Zod schemas for /api/profile/* endpoints
import { z } from "zod";
import { timezoneSchema } from "./common";

// Confidence level for brief output
export const confidenceSchema = z.enum(["low", "medium", "high"]);

/**
 * Context object for daily brief generation.
 * Contains orientation and phase data.
 */
export const briefContextSchema = z.object({
  season: z.string().optional(),
  phaseId: z.number().optional(),
  cyclePosDeg: z.number().optional(),
  degIntoPhase: z.number().optional(),
  phaseProgress01: z.number().optional(),
  phaseHeader: z.string().optional(),
  phaseOneLine: z.string().optional(),
  phaseDescription: z.string().optional(),
  phaseActionHint: z.string().optional(),
  journalPrompt: z.string().optional(),
  journalHelper: z.string().optional(),
  currentSun: z.string().optional(),
  lunation: z.string().optional(),
  progressed: z.string().optional(),
  asOf: z.string().optional(),
}).optional();

/**
 * Sabian symbol data for brief generation.
 */
export const sabianSchema = z.object({
  key: z.string().optional(),
  symbol: z.string().optional(),
  signal: z.string().optional(),
  shadow: z.string().optional(),
  directive: z.string().optional(),
  practice: z.string().optional(),
  journal: z.string().optional(),
  tags: z.array(z.string()).optional(),
}).optional();

/**
 * Output configuration for brief.
 */
export const briefOutputConfigSchema = z.object({
  maxDoNow: z.number().int().min(1).max(5).optional().default(3),
  maxAvoid: z.number().int().min(0).max(3).optional().default(2),
  maxSentencesMeaning: z.number().int().min(2).max(6).optional().default(4),
}).optional();

/**
 * Constraints for brief generation.
 */
export const briefConstraintsSchema = z.object({
  noPrediction: z.boolean().optional(),
  noNewClaims: z.boolean().optional(),
  citeInputs: z.boolean().optional(),
}).optional();

/**
 * Schema for /api/profile/brief
 * Validates daily brief generation requests.
 */
export const briefInputSchema = z.object({
  timezone: timezoneSchema.optional().default("America/New_York"),
  context: briefContextSchema,
  sabian: sabianSchema,
  dayKey: z.string().optional(),
  output: briefOutputConfigSchema,
  constraints: briefConstraintsSchema,
});

export type BriefInput = z.infer<typeof briefInputSchema>;
export type BriefContext = z.infer<typeof briefContextSchema>;
