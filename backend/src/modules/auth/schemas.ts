import { z } from "zod";

/**
 * Zod schemas validate untrusted input at runtime; `z.infer` derives the
 * matching TypeScript type at COMPILE time. One source of truth → no drift
 * between "what we validate" and "what the types say".
 */
export const signupSchema = z.object({
  name: z.string().min(2, "Name too short").max(50, "Name too long"),
  email: z.string().email("Invalid email format").max(100),
  password: z.string().min(6, "Password min 6 chars").max(72),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Invalid Indian phone number"),
});

export const signinSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

export const verifyOtpSchema = z.object({
  email: z.string().email("Invalid email format"),
  otp: z.string().regex(/^\d{6}$/, "OTP must be 6 digits"),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type SigninInput = z.infer<typeof signinSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
