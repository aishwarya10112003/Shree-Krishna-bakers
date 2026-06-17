import { asyncHandler } from "../lib/asyncHandler";
import { ApiError } from "../lib/ApiError";
import { verifyAccessToken } from "../lib/jwt";

/**
 * Authentication gate. Reads the short-lived access token from `x-auth-token`
 * (what the existing frontend sends) or a `Bearer` header, verifies it, and
 * attaches the typed payload to `req.user` for downstream handlers.
 */
export const requireAuth = asyncHandler(async (req, _res, next) => {
  const headerToken = req.header("x-auth-token");
  const bearer = req.header("authorization")?.replace(/^Bearer\s+/i, "");
  const token = headerToken || bearer;

  if (!token) throw ApiError.unauthorized("No token, access denied");

  try {
    req.user = verifyAccessToken(token);
    next();
  } catch (err) {
    if (err instanceof Error && err.name === "TokenExpiredError") {
      throw ApiError.unauthorized("Token expired, please login again");
    }
    throw ApiError.unauthorized("Invalid token");
  }
});
