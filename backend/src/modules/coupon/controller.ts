import { asyncHandler } from "../../lib/asyncHandler";
import { audit } from "../../lib/audit";
import { prisma } from "../../db/prisma";
import * as couponService from "./service";

/** Public: active offers for the "View Offers" strip. */
export const listPublic = asyncHandler(async (_req, res) => {
  res.json({ coupons: await couponService.listActiveCoupons() });
});

// ── Admin ──
export const listAll = asyncHandler(async (_req, res) => {
  res.json({ coupons: await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } }) });
});

export const create = asyncHandler(async (req, res) => {
  const coupon = await prisma.coupon.create({ data: req.body });
  await audit({
    actorId: req.user?.id ?? null,
    action: "coupon.create",
    entity: "Coupon",
    entityId: coupon.id,
    metadata: { code: coupon.code },
    ip: req.ip ?? null,
  });
  res.status(201).json({ message: "Coupon created", coupon });
});
