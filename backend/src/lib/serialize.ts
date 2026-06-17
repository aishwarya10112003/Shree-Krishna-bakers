/**
 * Serialization layer — the compatibility shim that lets us swap MongoDB for
 * Postgres/Prisma WITHOUT touching the frontend.
 *
 *  - Prisma uses `id` (cuid string); the frontend expects Mongo's `_id`.
 *  - Prisma enums are UPPER_SNAKE; the frontend compares display strings
 *    ("Order Placed") and lowercase roles ("admin").
 *
 * Every API response goes through here so the existing UI keeps working.
 */
import type { Order, OrderItem, Product, User, OrderStatus } from "@prisma/client";

const STATUS_TO_DISPLAY: Record<OrderStatus, string> = {
  ORDER_PLACED: "Order Placed",
  PREPARING: "Preparing",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

const DISPLAY_TO_STATUS: Record<string, OrderStatus> = Object.fromEntries(
  Object.entries(STATUS_TO_DISPLAY).map(([k, v]) => [v, k as OrderStatus]),
);

/** The five display strings the frontend/admin UI uses (for validation). */
export const ORDER_STATUS_DISPLAY = Object.values(STATUS_TO_DISPLAY);

export function statusToDisplay(s: OrderStatus): string {
  return STATUS_TO_DISPLAY[s];
}
export function displayToStatus(display: string): OrderStatus | undefined {
  return DISPLAY_TO_STATUS[display];
}

export function serializeProduct(p: Product) {
  return {
    _id: p.id,
    name: p.name,
    price: p.price,
    category: p.category,
    image: p.image,
    description: p.description,
    isAvailable: p.isAvailable,
    isBestseller: p.isBestseller,
    stockQuantity: p.stockQuantity,
    createdAt: p.createdAt,
  };
}

export function serializeOrderItem(i: OrderItem) {
  return {
    _id: i.id,
    productId: i.productId,
    name: i.name,
    price: i.price,
    quantity: i.quantity,
    image: i.image,
  };
}

type OrderWithRelations = Order & {
  items?: OrderItem[];
  user?: Pick<User, "id" | "name" | "email" | "phone"> | null;
};

export function serializeOrder(o: OrderWithRelations) {
  return {
    _id: o.id,
    status: statusToDisplay(o.status),
    totalAmount: o.totalAmount,
    address: o.address,
    tableNo: o.tableNo ?? "",
    createdAt: o.createdAt,
    items: o.items ? o.items.map(serializeOrderItem) : [],
    // Admin endpoints populate the customer; otherwise just the id string.
    userId: o.user
      ? { _id: o.user.id, name: o.user.name, email: o.user.email, phone: o.user.phone }
      : o.userId,
  };
}

/** Auth user for the frontend: keeps `id` and a LOWERCASE role ("admin"). */
export function serializeAuthUser(u: Pick<User, "id" | "name" | "email" | "role">) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role.toLowerCase() as "admin" | "customer",
  };
}
