const { z } = require("zod");

// 1. Define the Rules
const signupSchema = z.object({
  name: z.string().min(2, "Name too short").max(50, "Name too long"),

  // This checks if it LOOKS like an email (has @ and .)
  email: z.string().email("Invalid email format").max(100),

  password: z.string().min(6, "Password min 6 chars").max(30),

  // Indian Phone Regex: Starts with 6,7,8, or 9, followed by 9 digits
  phone: z.string().regex(/^[6-9]\d{9}$/, "Invalid Indian phone number"),
});

// 2. The Guard Function
const validateSignup = (req, res, next) => {
  try {
    signupSchema.parse(req.body); // Check data
    next(); // If good, pass to the route
  } catch (error) {
    // If bad, send error immediately
    const msg = error.errors?.[0]?.message || "Invalid input";
    return res.status(400).json({ msg });
  }
};

module.exports = { validateSignup };
