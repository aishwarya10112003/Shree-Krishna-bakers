import type { RequestHandler } from "express";
import { ApiError } from "../lib/ApiError";

/** Authorization gate: must run AFTER requireAuth. Allows only admins. */
export const adminOnly: RequestHandler = (req, _res, next) => {
  if (req.user?.role !== "ADMIN") {
    throw ApiError.forbidden("Access denied! Admins only.");
  }
  next();
};
