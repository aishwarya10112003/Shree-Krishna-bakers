import type { Request, Response, NextFunction, RequestHandler } from "express";

/**
 * Wraps an async route handler so any thrown error (or rejected promise) is
 * forwarded to Express's error pipeline via `next(err)`. This removes the
 * repetitive try/catch from every controller and guarantees the central error
 * handler always runs.
 */
export const asyncHandler =
  (
    fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
  ): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
