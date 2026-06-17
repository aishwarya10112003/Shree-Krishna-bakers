/**
 * Centralized, VALIDATED configuration.
 *
 * Instead of reading `process.env.X` (a `string | undefined`) all over the
 * codebase, we parse the whole environment ONCE here with Zod. If anything is
 * missing or malformed, the app fails fast at boot with a clear message —
 * never silently at runtime. Everywhere else imports the typed `env` object.
 */
import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(5001),

  // Datastores (point at the local Docker containers by default).
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),

  // Auth — short-lived access token + long-lived, revocable refresh token.
  JWT_ACCESS_SECRET: z.string().min(10, "JWT_ACCESS_SECRET is too short"),
  JWT_REFRESH_SECRET: z.string().min(10, "JWT_REFRESH_SECRET is too short"),
  ACCESS_TOKEN_TTL: z.string().default("15m"),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(7),

  // Email / OTP. `console` prints OTPs to the terminal (zero secrets needed).
  MAIL_DRIVER: z.enum(["console", "smtp"]).default("console"),
  SMTP_USER: z.string().optional().default(""),
  SMTP_PASS: z.string().optional().default(""),
  MAIL_FROM: z
    .string()
    .default("Shree Krishna Bakers <noreply@shreekrishna.com>"),

  // CORS — comma-separated allowed origins (used in production).
  FRONTEND_URL: z.string().default("http://localhost:5173"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid/missing environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

export const isDev = env.NODE_ENV === "development";
export const isProd = env.NODE_ENV === "production";
export const isTest = env.NODE_ENV === "test";

/** Allowed CORS origins as an array (production uses these explicitly). */
export const allowedOrigins = env.FRONTEND_URL.split(",").map((o) => o.trim());
