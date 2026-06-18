import { z } from "zod";

export const couponSchema = z.object({
  code: z
    .string()
    .min(2)
    .max(30)
    .transform((s) => s.toUpperCase()),
  description: z.string().max(200).optional(),
  type: z.enum(["PERCENT", "FLAT"]),
  value: z.coerce.number().int().positive(),
  minOrderAmount: z.coerce.number().int().min(0).optional(),
  maxDiscount: z.coerce.number().int().positive().optional(),
  isAuto: z.boolean().optional(),
  active: z.boolean().optional(),
  expiresAt: z.coerce.date().optional(),
});

export type CouponInput = z.infer<typeof couponSchema>;
