import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";

// Prisma-klient som singleton så dev-omladdningar inte skapar nya anslutningar.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient(): PrismaClient {
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  if (tursoUrl) {
    // Produktion (t.ex. Vercel): serverlös SQLite via Turso/libSQL. Samma
    // SQLite-dialekt som lokalt, så schema och migrationer gäller oförändrat.
    const adapter = new PrismaLibSQL({
      url: tursoUrl,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    return new PrismaClient({ adapter, log: ["error"] });
  }
  // Lokalt: fil-SQLite via DATABASE_URL i .env. Helt oförändrat mot tidigare.
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
