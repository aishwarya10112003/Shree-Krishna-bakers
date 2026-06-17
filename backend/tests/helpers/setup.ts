import { afterAll, beforeEach } from "vitest";
import { prisma } from "../../src/db/prisma";
import { redis } from "../../src/lib/redis";
import { resetDb } from "./fixtures";

// Fresh DB before every test.
beforeEach(async () => {
  await resetDb();
});

// Close connections so the test process can exit cleanly.
afterAll(async () => {
  await prisma.$disconnect();
  await redis.quit();
});
