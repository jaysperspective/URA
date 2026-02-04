// Zod schemas for /api/core and /api/lunation endpoints
import { z } from "zod";
import {
  birthComponentsSchema,
  birthDatetimeSchema,
  tzOffsetSchema,
  dateYMDSchema,
  timezoneSchema,
  latitudeSchema,
  longitudeSchema,
  detailLevelSchema,
  optionalCoerceBoolean,
} from "./common";

/**
 * Legacy input format:
 * - birth_datetime: "YYYY-MM-DD HH:MM" (local time)
 * - tz_offset: "+05:00" or "-08:00"
 * - as_of_date: "YYYY-MM-DD"
 */
export const legacyInputSchema = z.object({
  birth_datetime: birthDatetimeSchema,
  tz_offset: tzOffsetSchema,
  as_of_date: dateYMDSchema,
  lat: latitudeSchema.optional(),
  lon: longitudeSchema.optional(),
  latitude: latitudeSchema.optional(),
  longitude: longitudeSchema.optional(),
  includeBoundaries: optionalCoerceBoolean,
  include_boundaries: optionalCoerceBoolean,
  detail: detailLevelSchema,
});

/**
 * URA structured input format:
 * - year, month, day, hour, minute (birth components)
 * - timezone (IANA) or tz_offset
 * - asOfDate (optional, defaults to today)
 */
export const structuredInputSchema = birthComponentsSchema.extend({
  // Coordinates (either naming convention)
  lat: latitudeSchema.optional(),
  lon: longitudeSchema.optional(),
  latitude: latitudeSchema.optional(),
  longitude: longitudeSchema.optional(),
  // Timezone (one of these required)
  timezone: timezoneSchema.optional(),
  tz_offset: tzOffsetSchema.optional(),
  tzOffset: tzOffsetSchema.optional(),
  // As-of date
  asOfDate: dateYMDSchema.optional(),
  as_of_date: dateYMDSchema.optional(),
  // Options
  includeBoundaries: optionalCoerceBoolean,
  include_boundaries: optionalCoerceBoolean,
  detail: detailLevelSchema,
});

/**
 * Combined schema for /api/core that accepts either format.
 * The route handler normalizes both to a common internal format.
 */
export const coreInputSchema = z.union([
  legacyInputSchema,
  structuredInputSchema,
]);

/**
 * Text-wrapped input: { text: "key: value\n..." }
 * Used when content is sent as plain text in a JSON wrapper.
 */
export const textWrappedInputSchema = z.object({
  text: z.string(),
});

export type LegacyInput = z.infer<typeof legacyInputSchema>;
export type StructuredInput = z.infer<typeof structuredInputSchema>;
export type CoreInput = z.infer<typeof coreInputSchema>;
