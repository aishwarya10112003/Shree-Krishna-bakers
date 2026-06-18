/**
 * Database seed — fills an empty local DB with realistic mock data so the app
 * is runnable the moment someone clones the repo. Run with `npm run seed`.
 *
 * This is what replaces the (now inaccessible) production database: everything
 * here is fake, local, and safe to wipe.
 */
import bcrypt from "bcryptjs";
import { OrderStatus } from "@prisma/client";
import { prisma } from "./prisma";

const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

async function main() {
  console.log("🌱 Seeding database...");

  // 1. Clean slate (dev only). Delete in FK-safe order.
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

  // 2. Users (passwords are bcrypt-hashed, never plaintext).
  const customerHash = await bcrypt.hash("Password@123", 10);
  const adminHash = await bcrypt.hash("Admin@123", 10);

  const admin = await prisma.user.create({
    data: {
      name: "Bakery Admin",
      email: "admin@krishna.test",
      password: adminHash,
      phone: "9000000000",
      role: "ADMIN",
      isVerified: true,
    },
  });

  const customers = await Promise.all(
    [
      { name: "Aarav Sharma", email: "aarav@test.com", phone: "9000000001" },
      { name: "Diya Patel", email: "diya@test.com", phone: "9000000002" },
      { name: "Kabir Singh", email: "kabir@test.com", phone: "9000000003" },
    ].map((c) =>
      prisma.user.create({
        data: { ...c, password: customerHash, role: "CUSTOMER", isVerified: true },
      }),
    ),
  );

  // 3. Products. Emojis double as image placeholders (matches current UI).
  //    The 6 bestsellers use the EXACT names/prices/icons from the live UI.
  type Seed = {
    name: string;
    price: number;
    category: string;
    image: string;
    description?: string;
    isBestseller?: boolean;
    comingSoon?: boolean;
  };

  const productSeeds: Seed[] = [
    { name: "Paneer Blast Pizza", price: 260, category: "Pizza", image: "🍕", isBestseller: true, description: "Loaded paneer & veggies." },
    { name: "Choco Brownie...", price: 450, category: "Cake", image: "🎂", isBestseller: true, description: "Rich chocolate brownie cake." },
    { name: "Cheese Sandwich", price: 70, category: "Sandwich", image: "🥪", isBestseller: true, description: "Grilled cheese sandwich." },
    { name: "Cheese Burger", price: 260, category: "Burger", image: "🍔", isBestseller: true, description: "Double cheese burger." },
    { name: "Chowmein", price: 120, category: "Chinese", image: "🍜", isBestseller: true, description: "Hakka veg noodles." },
    { name: "Veg Patties", price: 50, category: "Snacks", image: "🥟", isBestseller: true, description: "Flaky veg patties." },
    { name: "Margherita Pizza", price: 220, category: "Pizza", image: "🍕" },
    { name: "Farmhouse Pizza", price: 300, category: "Pizza", image: "🍕" },
    { name: "Black Forest Cake", price: 500, category: "Cake", image: "🎂" },
    { name: "Red Velvet Pastry", price: 90, category: "Cake", image: "🧁", comingSoon: true },
    { name: "Veg Burger", price: 110, category: "Burger", image: "🍔" },
    { name: "Aloo Sandwich", price: 60, category: "Sandwich", image: "🥪" },
    { name: "Veg Manchurian", price: 150, category: "Chinese", image: "🥡" },
    { name: "Spring Rolls", price: 100, category: "Chinese", image: "🥢" },
    { name: "Masala Dosa", price: 120, category: "South Indian", image: "🥘" },
    { name: "Idli Sambar", price: 80, category: "South Indian", image: "🍲" },
    { name: "Aloo Paratha", price: 70, category: "Paratha", image: "🫓" },
    { name: "White Sauce Pasta", price: 180, category: "Pasta", image: "🍝" },
    { name: "Veg Roll", price: 90, category: "Rolls", image: "🌯" },
    { name: "Cold Coffee", price: 110, category: "Shakes", image: "🥤" },
    { name: "Chocolate Shake", price: 130, category: "Shakes", image: "🥤" },
    { name: "Virgin Mojito", price: 100, category: "Mocktails", image: "🍹", comingSoon: true },
  ];

  const products = await Promise.all(
    productSeeds.map((p) =>
      prisma.product.create({
        data: {
          name: p.name,
          price: p.price,
          category: p.category,
          image: p.image,
          description: p.description ?? `Delicious ${p.name}.`,
          isAvailable: true,
          isBestseller: p.isBestseller ?? false,
          comingSoon: p.comingSoon ?? false,
          stockQuantity: 50,
        },
      }),
    ),
  );

  // 4. Orders across the last 7 days with mixed statuses, so the analytics
  //    dashboard, kitchen board, and order history all show realistic data.
  const statuses: OrderStatus[] = [
    "ORDER_PLACED",
    "PREPARING",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "DELIVERED",
    "DELIVERED",
    "CANCELLED",
  ];

  let orderCount = 0;
  for (let i = 0; i < 24; i++) {
    const customer = pick(customers);
    const itemCount = 1 + Math.floor(Math.random() * 3);
    const chosen = Array.from({ length: itemCount }, () => pick(products));
    const items = chosen.map((p) => ({
      productId: p.id,
      name: p.name,
      price: p.price,
      image: p.image,
      quantity: 1 + Math.floor(Math.random() * 2),
    }));
    const totalAmount = items.reduce((s, it) => s + it.price * it.quantity, 0);

    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - Math.floor(Math.random() * 7));
    createdAt.setHours(9 + Math.floor(Math.random() * 12), Math.floor(Math.random() * 60));

    await prisma.order.create({
      data: {
        userId: customer.id,
        totalAmount,
        address: pick(["12 MG Road", "44 Park Street", "Dine-In", "7 Lake View"]),
        tableNo: "",
        status: pick(statuses),
        createdAt,
        items: { create: items },
      },
    });
    orderCount++;
  }

  // 5. Store settings (admin-controlled bakery location + radius + hours).
  await prisma.storeSettings.create({
    data: {
      id: "singleton",
      bakeryName: "Shri Krishna Bakers",
      latitude: 26.9124,
      longitude: 75.7873,
      address: "Jaipur, Rajasthan",
      deliveryRadiusKm: 5,
      freeDeliveryRadiusKm: 3,
      baseDeliveryFee: 20,
      perKmFee: 6,
      openTime: "10:00",
      closeTime: "22:00",
      onlineOrderingEnabled: true,
    },
  });

  // 6. Coupons (incl. the "Flat ₹50 above ₹299" auto-offer) and blog posts.
  await prisma.coupon.createMany({
    data: [
      { code: "FLAT50", description: "Flat ₹50 off on orders above ₹299", type: "FLAT", value: 50, minOrderAmount: 299, isAuto: true },
      { code: "WELCOME10", description: "10% off (up to ₹100), min order ₹199", type: "PERCENT", value: 10, maxDiscount: 100, minOrderAmount: 199 },
    ],
  });

  await prisma.blogPost.createMany({
    data: [
      { slug: "freshly-baked-every-morning", title: "Freshly Baked Every Morning", excerpt: "How our day starts before sunrise to bring you the freshest bakes.", content: "At Shri Krishna Bakers, every morning begins before sunrise. Our bakers knead, prove, and bake so that the first customer of the day gets a loaf still warm from the oven." },
      { slug: "the-story-behind-our-cakes", title: "The Story Behind Our Cakes", excerpt: "From classic black forest to custom celebration cakes.", content: "Every cake tells a story. We use the finest cocoa, fresh cream, and seasonal fruit to craft cakes worth celebrating." },
      { slug: "now-delivering-near-you", title: "Now Delivering Near You", excerpt: "Hot and fresh, delivered within our service area.", content: "Share your location at checkout to see if you're within our delivery radius — if you are, your order is on its way, hot and fresh." },
    ],
  });

  console.log(
    `✅ Seeded: 1 admin, ${customers.length} customers, ${products.length} products, ${orderCount} orders`,
  );
  console.log("   + store settings (radius 5 km), 2 coupons, 3 blog posts");
  console.log(`   Admin    → admin@krishna.test / Admin@123  (id: ${admin.id})`);
  console.log("   Customer → aarav@test.com / Password@123");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
