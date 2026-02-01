const jwt = require("jsonwebtoken");

/**
 * Authentication Middleware
 * 
 * Verifies JWT token from request headers and attaches user info to request object.
 * Must be used before routes that require authentication.
 */
module.exports = (req, res, next) => {
  // Get token from header
  const token = req.header("x-auth-token");

  // Check if token exists
  if (!token) {
    return res.status(401).json({ msg: "No token, access denied" });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Attach user info to request object
    req.user = decoded; // Contains: { id, role }
    
    next();
  } catch (err) {
    // Handle different JWT errors
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ msg: "Token expired, please login again" });
    }
    
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ msg: "Invalid token" });
    }
    
    // Other errors
    return res.status(401).json({ msg: "Token verification failed" });
  }
};