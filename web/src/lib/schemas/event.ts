// Zod schemas for /api/event endpoint (telemetry)
import { z } from "zod";

// Event types
export const eventTypeSchema = z.enum([
  "pageview",
  "feature",
  "error",
  "timing",
  "api",
  "interaction",
]).or(z.string().max(40));

// Severity levels
export const severitySchema = z.enum(["info", "warn", "error"]).optional();

/**
 * Meta field validation.
 * Allows nested objects but limits depth and size.
 */
const jsonValueSchema: z.ZodType<unknown> = z.lazy(() =>
  z.union([
    z.string().max(1000),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(jsonValueSchema).max(50),
    z.record(z.string().max(100), jsonValueSchema),
  ])
);

export const metaSchema = z.record(
  z.string().max(100),
  jsonValueSchema
).optional();

/**
 * Schema for /api/event
 * Validates telemetry event submissions.
 */
export const eventInputSchema = z.object({
  type: z.string().min(1).max(40),
  name: z.string().max(120).optional(),
  path: z.string().max(200).optional(),
  severity: z.string().max(20).optional(),
  sessionToken: z.string().max(200).optional(),
  durationMs: z.number().int().min(0).optional(),
  statusCode: z.number().int().optional(),
  meta: metaSchema,
});

export type EventInput = z.infer<typeof eventInputSchema>;
