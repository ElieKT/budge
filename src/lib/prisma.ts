import { PrismaClient } from "@prisma/client";

// Standard Next.js dev-mode singleton: hot-reload re-evaluates this module
// on every request, which would otherwise exhaust Postgres connections by
// creating a new PrismaClient each time.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
