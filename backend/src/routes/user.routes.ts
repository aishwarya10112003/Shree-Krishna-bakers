import { Router } from "express";
import rateLimit from "express-rate-limit";
import { validate } from "../middleware/validate";
import { requireAuth } from "../middleware/auth";
import { idempotency } from "../middleware/idempotency";
import * as authController from "../modules/auth/controller";
import * as productController from "../modules/product/controller";
import * as orderController from "../modules/order/controller";
import * as storeController from "../modules/store/controller";
import * as couponController from "../modules/coupon/controller";
import * as blogController from "../modules/blog/controller";
import { signinSchema, signupSchema, verifyOtpSchema } from "../modules/auth/schemas";
import { placeOrderSchema } from "../modules/order/schemas";

export const userRouter = Router();

// Stricter throttle on auth endpoints (brute-force protection).
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts", msg: "Too many attempts, please try again later." },
});

// ── Auth ──
userRouter.post("/signup", authLimiter, validate(signupSchema), authController.signup);
userRouter.post("/signin", authLimiter, validate(signinSchema), authController.signin);
userRouter.post("/verify-otp", authLimiter, validate(verifyOtpSchema), authController.verifyOtp);
userRouter.post("/refresh", authController.refresh);
userRouter.post("/logout", authController.logout);

// ── Public catalog ──
userRouter.get("/menu", productController.getMenu);
userRouter.get("/bestsellers", productController.getBestsellers);
userRouter.get("/store-settings", storeController.getSettings);
userRouter.get("/coupons", couponController.listPublic);
userRouter.get("/blogs", blogController.list);
userRouter.get("/blogs/:slug", blogController.getOne);

// ── Orders (auth required) ──
// validate BEFORE idempotency so we never reserve a key for an invalid request.
userRouter.post(
  "/place-order",
  requireAuth,
  validate(placeOrderSchema),
  idempotency,
  orderController.placeOrder,
);
userRouter.get("/orders", requireAuth, orderController.getMyOrders);
