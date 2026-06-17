import type { RequestHandler } from "express";

/** Catches any request that didn't match a route → consistent 404 JSON. */
export const notFound: RequestHandler = (req, res) => {
  res.status(404).json({
    error: "Not Found",
    msg: `Route ${req.method} ${req.path} not found`,
  });
};
