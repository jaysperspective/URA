// Validation helper for API routes
import { z, ZodSchema, ZodError } from "zod";
import { NextResponse } from "next/server";

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; response: NextResponse };

/**
 * Validate request body against a Zod schema.
 * Returns typed data on success, or a 422 response on failure.
 */
export function validateBody<T>(
  schema: ZodSchema<T>,
  body: unknown
): ValidationResult<T> {
  const result = schema.safeParse(body);

  if (!result.success) {
    const errors = formatZodErrors(result.error);
    return {
      success: false,
      response: NextResponse.json(
        {
          ok: false,
          error: "Validation failed",
          code: "VALIDATION_ERROR",
          details: errors,
        },
        { status: 422 }
      ),
    };
  }

  return { success: true, data: result.data };
}

/**
 * Format Zod errors into a user-friendly structure.
 */
function formatZodErrors(error: ZodError): Record<string, string[]> {
  const errors: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const path = issue.path.length > 0 ? issue.path.join(".") : "_root";
    if (!errors[path]) {
      errors[path] = [];
    }
    errors[path].push(issue.message);
  }

  return errors;
}

/**
 * Safely parse JSON from request, returning null on failure.
 */
export async function safeParseJson(req: Request): Promise<unknown | null> {
  try {
    return await req.json();
  } catch {
    return null;
  }
}

/**
 * Validate JSON body from request in one step.
 * Returns validation result or a 400 response for invalid JSON.
 */
export async function validateJsonBody<T>(
  req: Request,
  schema: ZodSchema<T>
): Promise<ValidationResult<T>> {
  const body = await safeParseJson(req);

  if (body === null) {
    return {
      success: false,
      response: NextResponse.json(
        {
          ok: false,
          error: "Invalid JSON body",
          code: "INVALID_JSON",
        },
        { status: 400 }
      ),
    };
  }

  return validateBody(schema, body);
}
