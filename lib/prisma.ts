import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Debug logging helper
const isDebugEnabled = () => {
  return process.env.DEBUG_AUTH === "true" || process.env.NODE_ENV !== "production";
};

// Configure Prisma logging based on environment
const prismaLogConfig: Array<"query" | "info" | "warn" | "error"> = isDebugEnabled()
  ? ["query", "info", "warn", "error"]
  : ["error"];

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: prismaLogConfig,
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
