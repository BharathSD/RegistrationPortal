import { PrismaClient } from "@prisma/client";
import { env } from "../../config/env";

declare global {
  var __prisma: PrismaClient | undefined;
}

/**
 * Singleton so hot-reload (tsx watch) and tests don't exhaust the Postgres
 * connection pool by instantiating a new client per import.
 */
export const prisma =
  global.__prisma ??
  new PrismaClient({
    log: env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (env.NODE_ENV !== "production") {
  global.__prisma = prisma;
}
