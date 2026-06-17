/**
 * Auth HTTP layer. Translates requests → service calls → responses. The refresh
 * token is delivered as an httpOnly cookie (invisible to JS → safe from XSS);
 * the access token is returned in the JSON body as `token` (what the existing
 * frontend stores and sends as `x-auth-token`).
 */
import type { CookieOptions, Response } from "express";
import { asyncHandler } from "../../lib/asyncHandler";
import { env, isProd } from "../../config/env";
import * as authService from "./service";

const REFRESH_COOKIE = "refreshToken";

const cookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: isProd,
  path: "/api/v1/user",
  maxAge: env.REFRESH_TOKEN_TTL_DAYS * 86_400_000,
};

function setRefreshCookie(res: Response, token: string) {
  res.cookie(REFRESH_COOKIE, token, cookieOptions);
}

export const signup = asyncHandler(async (req, res) => {
  res.status(201).json(await authService.signup(req.body));
});

export const verifyOtp = asyncHandler(async (req, res) => {
  res.json(await authService.verifyOtp(req.body));
});

export const signin = asyncHandler(async (req, res) => {
  const { accessToken, refreshToken, user } = await authService.signin(req.body);
  setRefreshCookie(res, refreshToken);
  res.json({ token: accessToken, user });
});

export const refresh = asyncHandler(async (req, res) => {
  const { accessToken, refreshToken, user } = await authService.refresh(
    req.cookies?.[REFRESH_COOKIE],
  );
  setRefreshCookie(res, refreshToken);
  res.json({ token: accessToken, user });
});

export const logout = asyncHandler(async (req, res) => {
  const result = await authService.logout(req.cookies?.[REFRESH_COOKIE]);
  res.clearCookie(REFRESH_COOKIE, { ...cookieOptions, maxAge: undefined });
  res.json(result);
});
