// Zod schemas for /api/admin/* endpoints
import { z } from "zod";

// User status enum
export const userStatusSchema = z.enum(["ACTIVE", "DISABLED", "BANNED"]);

/**
 * Schema for /api/admin/flags (POST)
 * Create or update a feature flag.
 */
export const flagInputSchema = z.object({
  key: z.string().min(1).max(100).regex(
    /^[a-z0-9_]+$/,
    "Flag key must be lowercase alphanumeric with underscores"
  ),
  enabled: z.boolean(),
  description: z.string().max(500).optional(),
  payload: z.unknown().optional(),
});

/**
 * Schema for /api/admin/flags/override (POST)
 * Override a feature flag for a specific user.
 */
export const flagOverrideInputSchema = z.object({
  flagKey: z.string().min(1).max(100),
  userId: z.number().int().positive(),
  enabled: z.boolean(),
  payload: z.unknown().optional(),
});

/**
 * Schema for /api/admin/users/status (POST)
 * Update a user's account status.
 */
export const userStatusInputSchema = z.object({
  userId: z.number().int().positive(),
  status: userStatusSchema,
});

export type FlagInput = z.infer<typeof flagInputSchema>;
export type FlagOverrideInput = z.infer<typeof flagOverrideInputSchema>;
export type UserStatusInput = z.infer<typeof userStatusInputSchema>;
export type UserStatus = z.infer<typeof userStatusSchema>;
