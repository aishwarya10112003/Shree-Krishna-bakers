import bcrypt from "bcryptjs";
import { prisma } from "../../src/db/prisma";
import { signAccessToken } from "../../src/lib/jwt";

/** Wipe all tables (FK-safe order) so each test starts from a clean slate. */
export async function resetDb() {
  await prisma.auditLog.deleteMany();
  await prisma.idempotencyKey.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.blogPost.deleteMany();
  await prisma.storeSettings.deleteMany();
}

/** Create a user and return it together with a ready-to-use access token. */
export async function makeUser(
  opts: {
    role?: "ADMIN" | "CUSTOMER";
    verified?: boolean;
    email?: string;
    password?: string;
  } = {},
) {
  const password = opts.password ?? "Password@123";
  const user = await prisma.user.create({
    data: {
      name: "Test User",
      email:
        opts.email ??
        `user_${Date.now()}_${Math.random().toString(36).slice(2)}@test.com`,
      password: await bcrypt.hash(password, 4), // low cost = fast tests
      phone: "9000000000",
      role: opts.role ?? "CUSTOMER",
      isVerified: opts.verified ?? true,
    },
  });
  const token = signAccessToken({ id: user.id, role: user.role });
  return { user, token, password };
}

export async function makeProduct(
  opts: { price?: number; stock?: number; available?: boolean } = {},
) {
  return prisma.product.create({
    data: {
      name: `Product ${Math.random().toString(36).slice(2)}`,
      price: opts.price ?? 100,
      category: "Test",
      image: "🍰",
      stockQuantity: opts.stock ?? 50,
      isAvailable: opts.available ?? true,
    },
  });
}

/** Upsert the singleton StoreSettings with test-friendly defaults (always-open,
 *  bakery at 0,0) merged with overrides. */
export async function setStoreSettings(
  overrides: Partial<{
    latitude: number;
    longitude: number;
    deliveryRadiusKm: number;
    freeDeliveryRadiusKm: number;
    baseDeliveryFee: number;
    perKmFee: number;
    openTime: string;
    closeTime: string;
    onlineOrderingEnabled: boolean;
  }> = {},
) {
  const base = {
    latitude: 0,
    longitude: 0,
    deliveryRadiusKm: 5,
    freeDeliveryRadiusKm: 3,
    baseDeliveryFee: 20,
    perKmFee: 6,
    openTime: "00:00",
    closeTime: "23:59",
    onlineOrderingEnabled: true,
    ...overrides,
  };
  return prisma.storeSettings.upsert({
    where: { id: "singleton" },
    update: base,
    create: { id: "singleton", ...base },
  });
}

export async function makeCoupon(data: {
  code: string;
  type: "PERCENT" | "FLAT";
  value: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  isAuto?: boolean;
}) {
  return prisma.coupon.create({ data });
}
