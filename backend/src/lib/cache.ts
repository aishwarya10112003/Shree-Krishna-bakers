import { redis } from "./redis";
import { logger } from "./logger";

/**
 * Cache-aside pattern:
 *   1. Look in Redis.            (hit  → return it, fast)
 *   2. On a miss, run `fetcher`. (slow path → the DB)
 *   3. Store the result with a TTL, then return it.
 *
 * Every Redis call is wrapped in try/catch so a cache outage degrades
 * gracefully to the database instead of taking the API down.
 */
export async function cached<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  try {
    const hit = await redis.get(key);
    if (hit) return JSON.parse(hit) as T;
  } catch (err) {
    logger.warn({ err, key }, "cache read failed — using source");
  }

  const fresh = await fetcher();

  try {
    await redis.set(key, JSON.stringify(fresh), "EX", ttlSeconds);
  } catch (err) {
    logger.warn({ err, key }, "cache write failed");
  }
  return fresh;
}

/** Drop cache keys (called after a write so stale data isn't served). */
export async function invalidate(...keys: string[]): Promise<void> {
  if (!keys.length) return;
  try {
    await redis.del(...keys);
  } catch (err) {
    logger.warn({ err, keys }, "cache invalidation failed");
  }
}

/** Centralized cache-key names so reads and invalidations can't drift apart. */
export const CACHE_KEYS = {
  menu: "menu:all",
  bestsellers: "menu:bestsellers",
};
