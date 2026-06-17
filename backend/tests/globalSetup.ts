import { execSync } from "node:child_process";

// Runs ONCE before the whole suite: push the Prisma schema into the test DB so
// all tables exist. `--accept-data-loss` is safe here — it's a throwaway DB.
const TEST_DATABASE_URL =
  "postgresql://krishna:krishna_dev_pw@localhost:5432/krishna_bakers?schema=krishna_test";

export default function setup() {
  execSync("npx prisma db push --skip-generate --accept-data-loss", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
  });
}
