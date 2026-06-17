import { defineConfig } from "vitest/config";

// Tests run against an ISOLATED database (krishna_test) so they never touch dev
// data. These env values are injected before any app code loads; because dotenv
// doesn't override already-set vars, src/config/env.ts picks these up.
// Isolated via a dedicated SCHEMA inside the same DB — Prisma creates the schema
// on push, so no separate database needs provisioning (works locally and in CI).
const TEST_DATABASE_URL =
  "postgresql://krishna:krishna_dev_pw@localhost:5432/krishna_bakers?schema=krishna_test";

export default defineConfig({
  test: {
    environment: "node",
    globalSetup: ["./tests/globalSetup.ts"],
    setupFiles: ["./tests/helpers/setup.ts"],
    fileParallelism: false, // tests share one DB → run files serially
    hookTimeout: 30_000,
    testTimeout: 30_000,
    env: {
      NODE_ENV: "test",
      DATABASE_URL: TEST_DATABASE_URL,
      REDIS_URL: "redis://localhost:6379",
      JWT_ACCESS_SECRET: "test_access_secret_value_1234567890",
      JWT_REFRESH_SECRET: "test_refresh_secret_value_1234567890",
      MAIL_DRIVER: "console",
    },
  },
});
