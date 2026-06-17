import pino from "pino";
import { isDev, isTest } from "../config/env";

/**
 * Structured logger (pino). Replaces scattered `console.log` calls with a
 * single, leveled, JSON-by-default logger. In development it's pretty-printed;
 * in tests it's silent; in production it emits structured JSON for log tooling.
 */
export const logger = pino({
  level: isTest ? "silent" : isDev ? "debug" : "info",
  transport: isDev
    ? {
        target: "pino-pretty",
        options: { colorize: true, translateTime: "SYS:HH:MM:ss", ignore: "pid,hostname" },
      }
    : undefined,
});
