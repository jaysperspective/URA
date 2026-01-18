import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/**
 * SECURITY: Validate DATABASE_URL environment variable.
 * Prevents application from starting with missing or obviously insecure database configuration.
 */
function validateDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error(
      "SECURITY: DATABASE_URL environment variable is not set. " +
      "Please configure a valid PostgreSQL connection string."
    );
  }

  // Basic URL validation
  if (!url.startsWith("postgresql://") && !url.startsWith("postgres://")) {
    throw new Error(
      "SECURITY: DATABASE_URL must be a valid PostgreSQL connection string " +
      "starting with postgresql:// or postgres://"
    );
  }

  // In production, warn about common insecure configurations
  if (process.env.NODE_ENV === "production") {
    // Check for default/placeholder credentials
    const insecurePatterns = [
      "user:password@",
      "postgres:postgres@",
      "admin:admin@",
      "root:root@",
      "@localhost",
      "@127.0.0.1",
    ];

    for (const pattern of insecurePatterns) {
      if (url.includes(pattern)) {
        console.warn(
          `SECURITY WARNING: DATABASE_URL contains "${pattern}" which may indicate ` +
          "insecure or development-only configuration. Please verify this is intentional."
        );
        break;
      }
    }
  }

  return url;
}

const databaseUrl = validateDatabaseUrl();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaPg({
      connectionString: databaseUrl,
    }),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
