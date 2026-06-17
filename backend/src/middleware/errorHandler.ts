import type { ErrorRequestHandler } from "express";
import { Prisma } from "@prisma/client";
import { ApiError } from "../lib/ApiError";
import { logger } from "../lib/logger";
import { isProd } from "../config/env";

/**
 * THE single place that turns errors into HTTP responses. Every response uses
 * the same shape and includes BOTH `error` and `msg` keys, because the existing
 * frontend reads `data.error` in some places and `data.msg` in others.
 */
export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  // 1. Expected, operational errors thrown by our own code.
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      error: err.message,
      msg: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
  }

  // 2. Known Prisma errors mapped to friendly responses.
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      const field = (err.meta?.target as string[] | undefined)?.join(", ") ?? "field";
      return res.status(409).json({ error: "Duplicate entry", msg: `${field} already exists` });
    }
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Not found", msg: "Record not found" });
    }
  }

  // 3. JWT errors (defense in depth; auth middleware usually handles these).
  if (err instanceof Error && err.name === "TokenExpiredError") {
    return res.status(401).json({ error: "Token expired", msg: "Token expired, please login again" });
  }
  if (err instanceof Error && err.name === "JsonWebTokenError") {
    return res.status(401).json({ error: "Invalid token", msg: "Invalid token" });
  }

  // 4. Anything else is an unexpected bug: log the full detail server-side,
  //    return a generic message to the client (no internal leakage in prod).
  logger.error({ err, path: req.path, method: req.method }, "Unhandled error");
  const message = isProd
    ? "Internal server error"
    : err instanceof Error
      ? err.message
      : "Something went wrong";
  return res.status(500).json({
    error: message,
    msg: message,
    ...(isProd ? {} : { stack: err instanceof Error ? err.stack : undefined }),
  });
};
