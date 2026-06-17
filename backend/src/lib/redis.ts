import Redis from "ioredis";
import { env } from "../config/env";
import { logger } from "./logger";

/**
 * Single Redis connection (the cache). ioredis auto-reconnects with backoff.
 * The app NEVER hard-depends on Redis — if it's down, the cache helper falls
 * back to the database, so the app keeps working (just without the speed-up).
 */
export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 2,
  retryStrategy: (times) => Math.min(times * 200, 2000),
  lazyConnect: false,
});

redis.on("connect", () => logger.info("✅ Connected to Redis"));
redis.on("error", (err) => logger.warn({ err: err.message }, "Redis error"));
