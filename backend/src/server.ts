/**
 * Process entry point: connect to the DB, start listening, and shut down
 * gracefully so in-flight requests finish and connections close cleanly.
 */
import { createApp } from "./app";
import { env } from "./config/env";
import { logger } from "./lib/logger";
import { prisma } from "./db/prisma";
import { redis } from "./lib/redis";

async function main() {
  await prisma.$connect();
  logger.info("✅ Connected to PostgreSQL");

  const app = createApp();
  const server = app.listen(env.PORT, () => {
    logger.info(`🚀 Server running on http://localhost:${env.PORT} (${env.NODE_ENV})`);
  });

  const shutdown = (signal: string) => {
    logger.info(`${signal} received — shutting down gracefully...`);
    server.close(() => {
      void Promise.allSettled([prisma.$disconnect(), redis.quit()]).then(() =>
        process.exit(0),
      );
    });
    // Don't hang forever if connections won't drain.
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

main().catch((err) => {
  logger.error({ err }, "❌ Failed to start server");
  process.exit(1);
});
