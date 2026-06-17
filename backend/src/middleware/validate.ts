import type { RequestHandler } from "express";
import type { ZodType } from "zod";
import { ApiError } from "../lib/ApiError";

/**
 * Validation middleware factory. Give it a Zod schema; it parses `req.body`,
 * rejects bad input with a 400 (+ the first human-readable message), and — key
 * detail — REPLACES req.body with the parsed/coerced data so handlers receive
 * clean, typed values (e.g. numeric price even if the form sent a string).
 */
export const validate =
  (schema: ZodType): RequestHandler =>
  (req, _res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const msg = result.error.issues[0]?.message ?? "Invalid input";
      throw ApiError.badRequest(msg, result.error.flatten());
    }
    req.body = result.data;
    next();
  };
