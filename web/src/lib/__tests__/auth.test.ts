// src/lib/__tests__/auth.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { hashPassword, verifyPassword } from "../auth";

// Mock bcryptjs
vi.mock("bcryptjs", () => ({
  default: {
    genSalt: vi.fn().mockResolvedValue("$2a$12$mockSalt"),
    hash: vi.fn().mockImplementation((password: string) => {
      return Promise.resolve(`$2a$12$mockSalt${password.substring(0, 20)}`);
    }),
    compare: vi.fn().mockImplementation((password: string, hash: string) => {
      // Simple mock: check if hash contains the password
      return Promise.resolve(hash.includes(password.substring(0, 20)));
    }),
  },
}));

describe("auth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("hashPassword", () => {
    it("returns a hash string", async () => {
      const hash = await hashPassword("testpassword123");
      expect(typeof hash).toBe("string");
      expect(hash.length).toBeGreaterThan(0);
    });

    it("returns different hashes for different passwords", async () => {
      const hash1 = await hashPassword("password1");
      const hash2 = await hashPassword("password2");
      expect(hash1).not.toBe(hash2);
    });

    it("throws on empty password", async () => {
      await expect(hashPassword("")).rejects.toThrow("Password required");
    });

    it("throws on whitespace-only password", async () => {
      await expect(hashPassword("   ")).rejects.toThrow("Password required");
    });

    it("trims whitespace from password", async () => {
      const hash = await hashPassword("  password  ");
      expect(typeof hash).toBe("string");
    });
  });

  describe("verifyPassword", () => {
    it("returns true for matching password", async () => {
      const hash = await hashPassword("testpassword123");
      const result = await verifyPassword("testpassword123", hash);
      expect(result).toBe(true);
    });

    it("returns false for wrong password", async () => {
      const hash = await hashPassword("testpassword123");
      const result = await verifyPassword("wrongpassword", hash);
      expect(result).toBe(false);
    });

    it("returns false for empty password", async () => {
      const result = await verifyPassword("", "somehash");
      expect(result).toBe(false);
    });

    it("returns false for empty hash", async () => {
      const result = await verifyPassword("password", "");
      expect(result).toBe(false);
    });
  });
});
