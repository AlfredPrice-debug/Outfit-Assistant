import { PrismaClient } from "@prisma/client";

// Next.js dev mode reloads route modules on every request, which would spin
// up a new PrismaClient (and a new connection pool) each time without this
// global cache. Production only ever imports this module once, so the cache
// is a no-op there.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
