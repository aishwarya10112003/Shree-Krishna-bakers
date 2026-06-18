import type { Request } from "express";
import { asyncHandler } from "../../lib/asyncHandler";
import * as adminService from "./service";

const buildCtx = (req: Request) => ({
  actorId: req.user?.id ?? null,
  ip: req.ip ?? null,
});

export const getOrders = asyncHandler(async (_req, res) => {
  res.json({ orders: await adminService.listOrders() });
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await adminService.updateOrderStatus(
    req.params.orderId as string,
    req.body.status,
    buildCtx(req),
  );
  res.json({ message: `Status updated to ${req.body.status}`, order });
});

export const getAnalytics = asyncHandler(async (_req, res) => {
  res.json(await adminService.analytics());
});

export const assignAgent = asyncHandler(async (req, res) => {
  const order = await adminService.assignAgent(
    req.params.orderId as string,
    req.body.agent,
    buildCtx(req),
  );
  res.json({ message: "Agent assigned", order });
});
