import { PrismaClient } from "@prisma/client";

// Prisma-klient som singleton så dev-omladdningar inte skapar nya anslutningar.
// Anslutningen (Postgres/Supabase) kommer ur DATABASE_URL.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
