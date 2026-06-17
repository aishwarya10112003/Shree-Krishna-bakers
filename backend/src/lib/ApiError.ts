/**
 * ApiError — a typed, HTTP-aware error.
 *
 * Anywhere in the app we can `throw ApiError.notFound("Order not found")` and
 * the central error handler turns it into a clean `404 { error, msg }` response.
 * `isOperational` distinguishes *expected* errors (bad input) from *bugs*.
 */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly details?: unknown;
  public readonly isOperational: boolean;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    // Restore the prototype chain (needed when extending built-ins in TS).
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  static badRequest(message: string, details?: unknown) {
    return new ApiError(400, message, details);
  }
  static unauthorized(message = "No token, access denied") {
    return new ApiError(401, message);
  }
  static forbidden(message = "Access denied") {
    return new ApiError(403, message);
  }
  static notFound(message = "Not found") {
    return new ApiError(404, message);
  }
  static conflict(message: string) {
    return new ApiError(409, message);
  }
}
