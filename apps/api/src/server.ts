import { createApp } from "./app";
import { env } from "./config/env";
import { logger } from "./config/logger";
import { prisma } from "./infrastructure/prisma/client";

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info(`🏏 Cricket Platform API listening on ${env.API_BASE_URL} (env: ${env.NODE_ENV})`);
  logger.info(`📖 Swagger docs available at ${env.API_BASE_URL}/docs`);
});

async function shutdown(signal: string) {
  logger.info(`Received ${signal}, shutting down gracefully...`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
  // Force-exit if graceful shutdown hangs (e.g. a stuck connection)
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
