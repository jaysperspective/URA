// Common Zod schemas shared across API endpoints
import { z } from "zod";

// Coordinate validation
export const latitudeSchema = z.number().min(-90).max(90);
export const longitudeSchema = z.number().min(-180).max(180);

export const coordinatesSchema = z.object({
  lat: latitudeSchema,
  lon: longitudeSchema,
});

// Alternative coordinate naming
export const coordinatesAltSchema = z.object({
  latitude: latitudeSchema,
  longitude: longitudeSchema,
});

// Birth datetime components
export const birthComponentsSchema = z.object({
  year: z.number().int().min(1800).max(2200),
  month: z.number().int().min(1).max(12),
  day: z.number().int().min(1).max(31),
  hour: z.number().int().min(0).max(23),
  minute: z.number().int().min(0).max(59),
});

// Timezone offset format: +HH:MM or -HH:MM
export const tzOffsetSchema = z.string().regex(
  /^[+-]\d{2}:\d{2}$/,
  "Timezone offset must be in format +HH:MM or -HH:MM"
);

// Date format: YYYY-MM-DD
export const dateYMDSchema = z.string().regex(
  /^\d{4}-\d{2}-\d{2}$/,
  "Date must be in format YYYY-MM-DD"
);

// Birth datetime format: YYYY-MM-DD HH:MM
export const birthDatetimeSchema = z.string().regex(
  /^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}$/,
  "Birth datetime must be in format YYYY-MM-DD HH:MM"
);

// IANA timezone string (basic validation)
export const timezoneSchema = z.string().min(1).max(100);

// Detail level for calculations
export const detailLevelSchema = z.enum(["quick", "full"]).optional();

// Helper to coerce string/number to number
export const coerceNumber = z.preprocess(
  (val) => (typeof val === "string" ? parseFloat(val) : val),
  z.number()
);

// Helper for optional number that could be string
export const optionalCoerceNumber = z.preprocess(
  (val) => (val === undefined || val === null ? undefined : typeof val === "string" ? parseFloat(val) : val),
  z.number().optional()
);

// Boolean that could be string "true"/"false"
export const coerceBoolean = z.preprocess(
  (val) => {
    if (typeof val === "boolean") return val;
    if (typeof val === "string") return val.toLowerCase() === "true";
    return val;
  },
  z.boolean()
);

// Optional boolean with string coercion
export const optionalCoerceBoolean = z.preprocess(
  (val) => {
    if (val === undefined || val === null) return undefined;
    if (typeof val === "boolean") return val;
    if (typeof val === "string") return val.toLowerCase() === "true";
    return val;
  },
  z.boolean().optional()
);
