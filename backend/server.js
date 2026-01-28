require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const { userRouter } = require("./routes/user");
const { adminRouter } = require("./routes/admin");
const errorHandler = require("./middleware/errorHandler");

const app = express();

// ============================================
// ENVIRONMENT VARIABLE VALIDATION
// ============================================
const requiredEnvVars = [
  "MONGO_URI",
  "JWT_SECRET",
  "EMAIL_USER",
  "EMAIL_PASS",
];

const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

if (missingVars.length > 0) {
  console.error("❌ Missing required environment variables:");
  missingVars.forEach((varName) => console.error(`   - ${varName}`));
  console.error("\nPlease create a .env file with all required variables.");
  process.exit(1);
}

// ============================================
// MIDDLEWARE SETUP
// ============================================

// Debug/version header to confirm the running server matches the code
app.use((req, res, next) => {
  res.setHeader("X-Server-Build", "cors-manual-v1");
  next();
});

// CORS Configuration (manual, Express 5 compatible)
// Dev: allow all localhost ports
// Prod: allow only FRONTEND_URL (comma-separated)
const isDevelopment = process.env.NODE_ENV === "development" || !process.env.NODE_ENV;
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(",").map((u) => u.trim())
  : [];

const isAllowedOrigin = (origin) => {
  if (!origin) return true; // Postman / mobile apps
  if (isDevelopment) {
    return (
      /^http:\/\/localhost:\d+$/.test(origin) ||
      /^http:\/\/127\.0\.0\.1:\d+$/.test(origin)
    );
  }
  return allowedOrigins.includes(origin);
};

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (origin && isAllowedOrigin(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    if (isDevelopment) {
      res.setHeader("X-Debug-Cors-Origin", origin);
    }
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET,POST,PUT,PATCH,DELETE,OPTIONS"
    );
    res.setHeader(
      "Access-Control-Allow-Headers",
      req.headers["access-control-request-headers"] ||
        "Content-Type, x-auth-token"
    );
  }

  // Handle preflight
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  // If origin is present but not allowed, block explicitly (production safety)
  if (origin && !isAllowedOrigin(origin) && !isDevelopment) {
    return res.status(403).json({
      error: "CORS Error",
      msg: "Origin not allowed. Configure FRONTEND_URL on the backend.",
    });
  }

  next();
});

// Request Logging (morgan)
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev")); // Detailed logging for development
} else {
  app.use(morgan("combined")); // Standard logging for production
}

// Rate Limiting - Prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/", limiter);

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: "Too many authentication attempts, please try again later.",
  skipSuccessfulRequests: true, // Don't count successful requests
});

app.use("/api/v1/user/signin", authLimiter);
app.use("/api/v1/user/signup", authLimiter);
app.use("/api/v1/user/verify-otp", authLimiter);

// Body Parser
app.use(express.json({ limit: "10mb" })); // Limit request body size
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ============================================
// ROUTES
// ============================================

app.get("/", (req, res) => {
  res.json({
    message: "Shree Krishna Bakers API is running...",
    version: "1.0.0",
    environment: process.env.NODE_ENV || "development",
  });
});

app.use("/api/v1/user", userRouter);
app.use("/api/v1/admin", adminRouter);

// 404 Handler - Must be after all routes
app.use((req, res) => {
  res.status(404).json({
    error: "Not Found",
    msg: `Route ${req.method} ${req.path} not found`,
  });
});

// ============================================
// ERROR HANDLING MIDDLEWARE
// ============================================
// Must be last middleware
app.use(errorHandler);

// ============================================
// DATABASE CONNECTION & SERVER START
// ============================================
const PORT = process.env.PORT || 5001;
const MONGO_URI = process.env.MONGO_URI;

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected Successfully");
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📝 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`🌐 CORS Configuration:`);
      if (isDevelopment && Array.isArray(allowedOrigins) && allowedOrigins[0] instanceof RegExp) {
        console.log(`   - Development mode: Allowing all localhost ports`);
      } else {
        console.log(`   - Allowed origins: ${allowedOrigins.join(", ") || "None (configure FRONTEND_URL)"}`);
      }
      if (!process.env.FRONTEND_URL && !isDevelopment) {
        console.warn(`   ⚠️  FRONTEND_URL not set. Set it in production!`);
      }
    });
  })
  .catch((err) => {
    console.error("❌ Database Connection Error:", err);
    process.exit(1);
  });
