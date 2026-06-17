/**
 * Express app assembly — separated from server start-up so tests can import the
 * app and hit it with Supertest WITHOUT opening a real port.
 */
import path from "node:path";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import rateLimit from "express-rate-limit";
import { allowedOrigins, env, isDev, isProd, isTest } from "./config/env";
import { logger } from "./lib/logger";
import { userRouter } from "./routes/user.routes";
import { adminRouter } from "./routes/admin.routes";
import { notFound } from "./middleware/notFound";
import { errorHandler } from "./middleware/errorHandler";

export function createApp() {
  const app = express();

  // We sit behind a proxy in production (needed for correct req.ip + rate limit).
  app.set("trust proxy", 1);

  // Security headers.
  app.use(helmet());

  // CORS: in dev/test allow any localhost port; in prod only configured origins.
  // `credentials: true` is required so the httpOnly refresh-token cookie flows.
  app.use(
    cors({
      origin(origin, cb) {
        if (!origin) return cb(null, true); // curl/postman/server-to-server
        if (isDev || isTest) {
          return cb(null, /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin));
        }
        return cb(null, allowedOrigins.includes(origin));
      },
      credentials: true,
    }),
  );

  app.use(cookieParser());
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));
  if (!isTest) app.use(pinoHttp({ logger }));

  // Global rate limit (auth routes add a stricter one on top).
  app.use(
    "/api",
    rateLimit({ windowMs: 15 * 60 * 1000, max: 500, standardHeaders: true, legacyHeaders: false }),
  );

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", env: env.NODE_ENV });
  });

  app.use("/api/v1/user", userRouter);
  app.use("/api/v1/admin", adminRouter);

  if (isProd) {
    // Serve the built React app and let the SPA handle client-side routing.
    const distPath = path.join(__dirname, "..", "..", "dist");
    app.use(express.static(distPath));
    app.get(/.*/, (req, res, next) => {
      if (req.path.startsWith("/api")) return next();
      res.sendFile(path.join(distPath, "index.html"));
    });
  } else {
    app.get("/", (_req, res) => {
      res.json({ message: "Shree Krishna Bakers API", version: "2.0.0", env: env.NODE_ENV });
    });
  }

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
