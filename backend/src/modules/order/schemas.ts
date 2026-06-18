import { z } from "zod";

/**
 * Note: `productId` is now REQUIRED and `price`/`totalAmount` are accepted but
 * IGNORED by the server. The server recomputes every price from the database,
 * so a tampered client payload (₹1 for a ₹500 cake) can't affect what's stored.
 */
const orderItemSchema = z.object({
  productId: z.string().min(1, "Each item must reference a product"),
  name: z.string().min(1, "Product name is required"),
  quantity: z.coerce.number().int().positive("Quantity must be a positive integer"),
  price: z.coerce.number().optional(), // ignored server-side
  image: z.string().optional(),
});

export const placeOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1, "At least one item required"),
  totalAmount: z.coerce.number().optional(), // ignored server-side (recomputed)
  address: z.string().min(1, "Address is required").max(300),
  tableNo: z.string().max(20).optional(),
  // Delivery / serviceability — required for DELIVERY orders (enforced in service).
  deliveryType: z.enum(["DELIVERY", "DINE_IN"]).optional(),
  deliveryLat: z.coerce.number().min(-90).max(90).optional(),
  deliveryLng: z.coerce.number().min(-180).max(180).optional(),
  phone: z.string().max(20).optional(),
  couponCode: z.string().max(30).optional(),
});

export type PlaceOrderInput = z.infer<typeof placeOrderSchema>;
