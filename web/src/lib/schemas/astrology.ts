// Zod schemas for /api/astrology/* endpoints
import { z } from "zod";

// Lens options for synthesis
export const lensSchema = z.enum([
  "general",
  "relationships",
  "work",
  "health",
  "creativity",
  "spiritual",
  "shadow",
  "growth",
]);

// Mode options for synthesis
export const modeSchema = z.enum(["placement", "pair", "mini_chart"]);

// Output format options
export const outputFormatSchema = z.enum(["short", "standard", "deep"]);

/**
 * Schema for /api/astrology/synthesize
 * Validates doctrine key synthesis requests.
 */
export const synthesizeInputSchema = z
  .object({
    version: z.literal("1.0"),
    mode: modeSchema,
    keys: z.array(z.string().min(1)).min(1).max(6),
    lens: lensSchema.optional().default("general"),
    question: z.string().max(500).optional(),
    output: z
      .object({
        format: outputFormatSchema.optional().default("standard"),
        maxBullets: z.number().int().min(1).max(10).optional().default(5),
        includeJournalPrompts: z.boolean().optional().default(true),
      })
      .optional(),
  })
  .refine(
    (data) => {
      const keyCount = data.keys.length;
      switch (data.mode) {
        case "placement":
          return keyCount === 1;
        case "pair":
          return keyCount === 2;
        case "mini_chart":
          return keyCount >= 3 && keyCount <= 6;
        default:
          return false;
      }
    },
    {
      message:
        "keys count must match mode: placement=1, pair=2, mini_chart=3-6",
      path: ["keys"],
    }
  );

/**
 * Schema for /api/astrology/natal
 * Validates birth data for natal chart calculation.
 */
export const natalInputSchema = z.object({
  birthDate: z.string().regex(
    /^\d{4}-\d{2}-\d{2}$/,
    "birthDate must be YYYY-MM-DD format"
  ),
  birthTime: z.string().regex(
    /^\d{2}:\d{2}$/,
    "birthTime must be HH:MM format"
  ),
  birthPlace: z.string().max(200).optional(),
});

export type Lens = z.infer<typeof lensSchema>;
export type Mode = z.infer<typeof modeSchema>;
export type SynthesizeInput = z.infer<typeof synthesizeInputSchema>;
export type NatalInput = z.infer<typeof natalInputSchema>;
