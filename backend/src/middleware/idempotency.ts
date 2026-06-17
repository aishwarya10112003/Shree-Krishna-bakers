import crypto from "node:crypto";
import { Prisma } from "@prisma/client";
import type { Response } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import { ApiError } from "../lib/ApiError";
import { prisma } from "../db/prisma";
import { logger } from "../lib/logger";

/**
 * Idempotency for unsafe POSTs (placing an order).
 *
 * The client sends a unique `Idempotency-Key` header per checkout attempt. We
 * "reserve" that key in the DB FIRST (the unique constraint makes concurrent
 * duplicates collide), then capture and persist the response. A replay of the
 * same key returns the stored response instead of creating a second order —
 * so a double-tap or a network retry can never double-charge the customer.
 *
 * Must run AFTER requireAuth (it uses req.user).
 */
export const idempotency = asyncHandler(async (req, res, next) => {
  const key = req.header("Idempotency-Key");
  if (!key) return next(); // header is optional; proceed normally if absent

  const userId = req.user!.id;
  const requestHash = crypto
    .createHash("sha256")
    .update(JSON.stringify(req.body ?? {}))
    .digest("hex");

  // Step 1: try to reserve the key (statusCode 0 = "in progress").
  try {
    await prisma.idempotencyKey.create({
      data: {
        key,
        userId,
        method: req.method,
        path: req.path,
        requestHash,
        statusCode: 0,
        responseBody: {},
      },
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      // Key already exists → this is a replay or a concurrent duplicate.
      const existing = await prisma.idempotencyKey.findUnique({ where: { key } });
      if (!existing) throw err;
      if (existing.requestHash !== requestHash) {
        throw ApiError.conflict("Idempotency-Key was reused with a different request body");
      }
      if (existing.statusCode === 0) {
        throw new ApiError(409, "A request with this Idempotency-Key is still being processed");
      }
      return res
        .status(existing.statusCode)
        .json(existing.responseBody as Record<string, unknown>);
    }
    throw err;
  }

  // Step 2: reserved successfully. Wrap res.json to persist the real response.
  const originalJson = res.json.bind(res);
  res.json = ((body: unknown) => {
    void prisma.idempotencyKey
      .update({
        where: { key },
        data: { statusCode: res.statusCode, responseBody: body as Prisma.InputJsonValue },
      })
      .catch((e) => logger.error({ e }, "Failed to persist idempotent response"));
    return originalJson(body);
  }) as Response["json"];

  next();
});
