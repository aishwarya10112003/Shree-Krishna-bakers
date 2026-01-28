const { z } = require("zod");

// ============================================
// VALIDATION SCHEMAS
// ============================================

// 1. Signup Schema
const signupSchema = z.object({
  name: z.string().min(2, "Name too short").max(50, "Name too long"),
  email: z.string().email("Invalid email format").max(100),
  password: z.string().min(6, "Password min 6 chars").max(30),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Invalid Indian phone number"),
});

// 2. Signin Schema
const signinSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

// 3. OTP Verification Schema
const verifyOtpSchema = z.object({
  email: z.string().email("Invalid email format"),
  otp: z.string().regex(/^\d{6}$/, "OTP must be 6 digits"),
});

// 4. Product Schema
const productSchema = z.object({
  name: z.string().min(1, "Product name is required").max(100, "Name too long"),
  price: z.number().positive("Price must be positive"),
  category: z.string().min(1, "Category is required").max(50),
  image: z.string().min(1, "Image is required"), // Can be URL or emoji
  description: z.string().max(500, "Description too long").optional(),
  isAvailable: z.boolean().optional(),
});

// 5. Bulk Products Schema
const bulkProductsSchema = z
  .array(productSchema)
  .min(1, "At least one product required");

// 6. Order Item Schema
// `productId` is optional so that virtual items (like manual \"bestsellers\")
// that aren't backed by a real Product document can still be ordered. When
// present it must look like a valid MongoDB ObjectId string so Mongoose
// doesn't throw a CastError.
const orderItemSchema = z.object({
  productId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Product ID must be a valid MongoDB ObjectId")
    .optional(),
  name: z.string().min(1, "Product name is required"),
  quantity: z.number().int().positive("Quantity must be a positive integer"),
  price: z.number().positive("Price must be positive"),
  image: z.string().optional(),
});

// 7. Place Order Schema
const placeOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1, "At least one item required"),
  totalAmount: z.number().positive("Total amount must be positive"),
  address: z.string().min(1, "Address is required").max(200),
  tableNo: z.string().max(20).optional(),
});

// 8. Order Status Update Schema
const orderStatusSchema = z.object({
  status: z.enum(
    ["Order Placed", "Preparing", "Out for Delivery", "Delivered", "Cancelled"],
    { errorMap: () => ({ message: "Invalid status value" }) },
  ),
});

// ============================================
// VALIDATION MIDDLEWARE FUNCTIONS
// ============================================

// Generic validation middleware factory
const validate = (schema) => {
  return (req, res, next) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      const msg = error.errors?.[0]?.message || "Invalid input";
      return res.status(400).json({ msg, errors: error.errors });
    }
  };
};

// Specific validation middlewares
const validateSignup = validate(signupSchema);
const validateSignin = validate(signinSchema);
const validateVerifyOtp = validate(verifyOtpSchema);
const validateProduct = validate(productSchema);
const validateBulkProducts = validate(bulkProductsSchema);
const validatePlaceOrder = validate(placeOrderSchema);
const validateOrderStatus = validate(orderStatusSchema);

module.exports = {
  validateSignup,
  validateSignin,
  validateVerifyOtp,
  validateProduct,
  validateBulkProducts,
  validatePlaceOrder,
  validateOrderStatus,
};
