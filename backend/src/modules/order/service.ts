import { prisma } from "../../db/prisma";
import { ApiError } from "../../lib/ApiError";
import { serializeOrder } from "../../lib/serialize";
import { getStoreSettings } from "../store/service";
import { evaluateServiceability } from "../../lib/serviceability";
import { resolveDiscount } from "../coupon/service";
import type { PlaceOrderInput } from "./schemas";

/**
 * Place an order — security & correctness centerpiece.
 *
 *  1. Serviceability (DELIVERY only): the bakery location, radius, hours and fee
 *     all come from admin-controlled StoreSettings; the server re-checks the
 *     customer is inside the radius and within hours, and recomputes the fee.
 *  2. One transaction: recompute item prices from the DB (no client trust),
 *     atomically check-and-decrement stock (no oversell), apply coupon/auto-offer.
 */
export async function placeOrder(userId: string, input: PlaceOrderInput) {
  const deliveryType = input.deliveryType ?? "DELIVERY";

  let distanceKm: number | null = null;
  let deliveryFee = 0;

  if (deliveryType === "DELIVERY") {
    if (input.deliveryLat == null || input.deliveryLng == null) {
      throw ApiError.badRequest("Please add your delivery location.");
    }
    if (!input.phone) {
      throw ApiError.badRequest("A phone number is required for delivery.");
    }

    const settings = await getStoreSettings();
    if (!settings.onlineOrderingEnabled) {
      throw ApiError.badRequest("Online ordering is currently disabled.");
    }

    const s = evaluateServiceability(settings, input.deliveryLat, input.deliveryLng);
    if (!s.withinHours) {
      throw ApiError.badRequest(
        `We're closed right now. Orders are served between ${settings.openTime} and ${settings.closeTime}.`,
      );
    }
    if (!s.serviceable) {
      throw ApiError.badRequest(
        `We are not serviceable in your area. We currently deliver up to ${settings.deliveryRadiusKm} km from the bakery (your distance: ${s.distanceKm} km).`,
      );
    }
    distanceKm = s.distanceKm;
    deliveryFee = s.deliveryFee;
  }

  const order = await prisma.$transaction(async (tx) => {
    let itemTotal = 0;
    const lineItems: {
      productId: string;
      name: string;
      price: number;
      image: string | null;
      quantity: number;
    }[] = [];

    for (const item of input.items) {
      const product = await tx.product.findFirst({ where: { id: item.productId } });
      if (!product || !product.isAvailable || product.comingSoon) {
        throw ApiError.badRequest(`"${item.name}" is no longer available`);
      }
      const updated = await tx.product.updateMany({
        where: { id: product.id, stockQuantity: { gte: item.quantity } },
        data: { stockQuantity: { decrement: item.quantity } },
      });
      if (updated.count === 0) {
        throw ApiError.badRequest(`Not enough stock for "${product.name}"`);
      }
      itemTotal += product.price * item.quantity; // SERVER price
      lineItems.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: item.quantity,
      });
    }

    // Coupon (explicit code) or best auto-offer, applied to the item subtotal.
    const { code, discount } = await resolveDiscount(itemTotal, input.couponCode);
    const totalAmount = Math.max(0, itemTotal + deliveryFee - discount);

    return tx.order.create({
      data: {
        userId,
        totalAmount,
        address: input.address,
        tableNo: input.tableNo ?? "",
        deliveryType,
        deliveryLat: input.deliveryLat ?? null,
        deliveryLng: input.deliveryLng ?? null,
        customerPhone: input.phone ?? null,
        distanceKm,
        deliveryFee,
        discount,
        couponCode: code,
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
