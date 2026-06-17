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
