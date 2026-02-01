/**
 * Centralized Error Handling Middleware
 * 
 * This middleware catches all errors and provides consistent error responses.
 * In production, sensitive error details are hidden from clients.
 */

const errorHandler = (err, req, res, next) => {
  // Log error for debugging
  console.error("Error:", {
    message: err.message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      error: "Validation Error",
      msg: messages.join(", "),
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(400).json({
      error: "Duplicate Entry",
      msg: `${field} already exists`,
    });
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === "CastError") {
    return res.status(400).json({
      error: "Invalid ID",
      msg: "Invalid ID format",
    });
  }

  // CORS errors
  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({
      error: "CORS Error",
      msg: "Origin not allowed. Please check CORS configuration.",
      ...(process.env.NODE_ENV === "development" && {
        hint: "In development, localhost ports are automatically allowed. Check FRONTEND_URL in production.",
      }),
    });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      error: "Invalid Token",
      msg: "Token is not valid",
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      error: "Token Expired",
      msg: "Token has expired. Please login again.",
    });
  }

  // Default error response
  const statusCode = err.statusCode || err.status || 500;
  const message =
    process.env.NODE_ENV === "production"
      ? "Internal server error"
      : err.message || "Something went wrong";

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

module.exports = errorHandler;

