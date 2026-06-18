import type { Coupon } from "@prisma/client";
import { prisma } from "../../db/prisma";
import { ApiError } from "../../lib/ApiError";

/** Active, non-expired coupons (shown in the "View Offers" strip). */
export async function listActiveCoupons() {
  return prisma.coupon.findMany({
    where: {
      active: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    orderBy: { createdAt: "desc" },
  });
}

/** Discount (in rupees) a coupon yields for an item subtotal; 0 if ineligible. */
export function discountFor(coupon: Coupon, itemTotal: number): number {
  if (!coupon.active) return 0;
  if (coupon.expiresAt && coupon.expiresAt < new Date()) return 0;
  if (itemTotal < coupon.minOrderAmount) return 0;

  let discount =
    coupon.type === "PERCENT"
      ? Math.floor((itemTotal * coupon.value) / 100)
      : coupon.value;

  if (coupon.maxDiscount != null) discount = Math.min(discount, coupon.maxDiscount);
  return Math.min(discount, itemTotal); // never discount below zero
}

/**
 * Resolve the discount for an order:
 *  - if `code` is given, validate it (throws on invalid/ineligible);
 *  - otherwise auto-apply the BEST eligible auto-offer.
 */
export async function resolveDiscount(
  itemTotal: number,
  code?: string | null,
): Promise<{ code: string | null; discount: number }> {
  if (code) {
    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });
    if (!coupon || !coupon.active) throw ApiError.badRequest("Invalid or inactive coupon");
    const discount = discountFor(coupon, itemTotal);
    if (discount === 0) throw ApiError.badRequest("Coupon not applicable to this order");
    return { code: coupon.code, discount };
  }

  const autos = await prisma.coupon.findMany({ where: { active: true, isAuto: true } });
  let best: { code: string | null; discount: number } = { code: null, discount: 0 };
  for (const c of autos) {
    const d = discountFor(c, itemTotal);
    if (d > best.discount) best = { code: c.code, discount: d };
  }
  return best;
}
