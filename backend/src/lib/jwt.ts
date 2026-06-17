import crypto from "node:crypto";
import jwt, { type SignOptions } from "jsonwebtoken";
import type { Role } from "@prisma/client";
import { env } from "../config/env";

/**
 * Two-token auth model:
 *  - ACCESS token: short-lived (minutes), sent on every request. Stateless.
 *  - REFRESH token: long-lived (days), httpOnly cookie, stored hashed in the DB
 *    so it can be rotated and revoked (true logout).
 */

export type AccessTokenPayload = { id: string; role: Role };
export type RefreshTokenPayload = { id: string };

export function signAccessToken(payload: AccessTokenPayload): string {
  // The `ms` string ("15m") is valid at runtime; cast satisfies the strict type.
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.ACCESS_TOKEN_TTL as SignOptions["expiresIn"],
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
}

export function signRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: `${env.REFRESH_TOKEN_TTL_DAYS}d` as SignOptions["expiresIn"],
  });
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
}

/**
 * SHA-256 of a refresh token. We store only this hash in the DB, so a stolen
 * database snapshot can't be used to forge sessions, and we can look a token up
 * to revoke/rotate it.
 */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
