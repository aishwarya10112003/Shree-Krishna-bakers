import { prisma } from "../../db/prisma";
import { ApiError } from "../../lib/ApiError";
import { serializeOrder } from "../../lib/serialize";
import type { PlaceOrderInput } from "./schemas";

/**
 * Place an order — the security & correctness centerpiece.
 *
 * Everything runs inside ONE database transaction (all-or-nothing). For each
 * line we:
 *   1. Recompute the price from the DB (the source of truth) — the client's
 *      price is never trusted. This kills price-tampering.
 *   2. Atomically check-and-decrement stock with a conditional UPDATE
 *      (`WHERE stockQuantity >= qty`). Under concurrent checkouts for the last
 *      unit, exactly one UPDATE matches → no overselling, no race condition.
 */
export async function placeOrder(userId: string, input: PlaceOrderInput) {
  const order = await prisma.$transaction(async (tx) => {
    let total = 0;
    const lineItems: {
      productId: string;
      name: string;
      price: number;
      image: string | null;
      quantity: number;
    }[] = [];

    for (const item of input.items) {
      // findFirst goes through the soft-delete filter, so deleted products read as gone.
      const product = await tx.product.findFirst({ where: { id: item.productId } });
      if (!product || !product.isAvailable) {
        throw ApiError.badRequest(`"${item.name}" is no longer available`);
      }

      const updated = await tx.product.updateMany({
        where: { id: product.id, stockQuantity: { gte: item.quantity } },
        data: { stockQuantity: { decrement: item.quantity } },
      });
      if (updated.count === 0) {
        throw ApiError.badRequest(`Not enough stock for "${product.name}"`);
      }

      total += product.price * item.quantity; // SERVER price, not client price
      lineItems.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: item.quantity,
      });
    }

    return tx.order.create({
      data: {
        userId,
        totalAmount: total,
        address: input.address,
        tableNo: input.tableNo ?? "",
        items: { create: lineItems },
      },
      include: { items: true },
    });
  });

  return serializeOrder(order);
}

export async function getUserOrders(userId: string) {
  const orders = await prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });
  return orders.map((o) => serializeOrder(o));
}
