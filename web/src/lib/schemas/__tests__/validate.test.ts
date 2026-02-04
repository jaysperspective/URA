// src/lib/schemas/__tests__/validate.test.ts
import { describe, it, expect } from "vitest";
import { z } from "zod";
import { validateBody, safeParseJson, validateJsonBody } from "../validate";

describe("schemas/validate", () => {
  const testSchema = z.object({
    name: z.string().min(1),
    age: z.number().int().positive(),
  });

  describe("validateBody", () => {
    it("returns success with data for valid input", () => {
      const result = validateBody(testSchema, { name: "John", age: 30 });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("John");
        expect(result.data.age).toBe(30);
      }
    });

    it("returns failure with response for invalid input", () => {
      const result = validateBody(testSchema, { name: "", age: -5 });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.response.status).toBe(422);
      }
    });

    it("includes validation errors in response body", async () => {
      const result = validateBody(testSchema, { name: "", age: "invalid" });
      expect(result.success).toBe(false);
      if (!result.success) {
        const body = await result.response.json();
        expect(body.ok).toBe(false);
        expect(body.code).toBe("VALIDATION_ERROR");
        expect(body.details).toBeDefined();
      }
    });

    it("returns failure for missing required fields", () => {
      const result = validateBody(testSchema, {});
      expect(result.success).toBe(false);
    });

    it("returns failure for null input", () => {
      const result = validateBody(testSchema, null);
      expect(result.success).toBe(false);
    });

    it("returns failure for undefined input", () => {
      const result = validateBody(testSchema, undefined);
      expect(result.success).toBe(false);
    });
  });

  describe("safeParseJson", () => {
    it("parses valid JSON from request", async () => {
      const mockRequest = new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({ name: "test" }),
        headers: { "Content-Type": "application/json" },
      });

      const result = await safeParseJson(mockRequest);
      expect(result).toEqual({ name: "test" });
    });

    it("returns null for invalid JSON", async () => {
      const mockRequest = new Request("http://localhost", {
        method: "POST",
        body: "not json",
        headers: { "Content-Type": "application/json" },
      });

      const result = await safeParseJson(mockRequest);
      expect(result).toBe(null);
    });
  });

  describe("validateJsonBody", () => {
    it("returns success for valid JSON body", async () => {
      const mockRequest = new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({ name: "John", age: 30 }),
        headers: { "Content-Type": "application/json" },
      });

      const result = await validateJsonBody(mockRequest, testSchema);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("John");
      }
    });

    it("returns 400 error for invalid JSON", async () => {
      const mockRequest = new Request("http://localhost", {
        method: "POST",
        body: "not json",
        headers: { "Content-Type": "application/json" },
      });

      const result = await validateJsonBody(mockRequest, testSchema);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.response.status).toBe(400);
        const body = await result.response.json();
        expect(body.code).toBe("INVALID_JSON");
      }
    });

    it("returns 422 error for valid JSON that fails validation", async () => {
      const mockRequest = new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({ name: "", age: -5 }),
        headers: { "Content-Type": "application/json" },
      });

      const result = await validateJsonBody(mockRequest, testSchema);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.response.status).toBe(422);
      }
    });
  });
});
