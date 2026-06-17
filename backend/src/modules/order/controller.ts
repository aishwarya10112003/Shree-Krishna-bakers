import { asyncHandler } from "../../lib/asyncHandler";
import * as orderService from "./service";

export const placeOrder = asyncHandler(async (req, res) => {
  // req.user is guaranteed by requireAuth running before this handler.
  const order = await orderService.placeOrder(req.user!.id, req.body);
  res.status(201).json({
    message: "Order placed successfully!",
    orderId: order._id,
    order,
  });
});

export const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await orderService.getUserOrders(req.user!.id);
  res.json({ orders });
});
