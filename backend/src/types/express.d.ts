import type { AccessTokenPayload } from "../lib/jwt";

/**
 * Augment Express's Request type so `req.user` (set by the auth middleware)
 * and `req.idempotencyKey` are fully typed everywhere — no `as any` casts.
 */
declare global {
  namespace Express {
    interface Request {
      user?: AccessTokenPayload;
      idempotencyKey?: string;
    }
  }
}

export {};
