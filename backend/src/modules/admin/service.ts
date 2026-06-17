import { prisma } from "../../db/prisma";
import { ApiError } from "../../lib/ApiError";
import { audit } from "../../lib/audit";
import { displayToStatus, serializeOrder } from "../../lib/serialize";

type ActorCtx = { actorId?: string | null; ip?: string | null };

export async function listOrders() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: { items: true, user: true },
  });
  return orders.map((o) => serializeOrder(o));
}

export async function updateOrderStatus(
  orderId: string,
  displayStatus: string,
  ctx: ActorCtx,
) {
  const status = displayToStatus(displayStatus);
  if (!status) throw ApiError.badRequest("Invalid status value");

  // Prisma throws P2025 if the order doesn't exist → mapped to 404 centrally.
  const order = await prisma.order.update({
    where: { id: orderId },
    data: { status },
    include: { items: true, user: true },
  });
  await audit({
    actorId: ctx.actorId,
    action: "order.status_change",
    entity: "Order",
    entityId: orderId,
    metadata: { status: displayStatus },
    ip: ctx.ip,
  });
  return serializeOrder(order);
}

/**
 * Dashboard analytics. Fixes the original "last 7 days" bug (it returned the
 * OLDEST 7 days). Here we bucket by day across a real rolling 7-day window and
 * pre-fill empty days with 0 so the chart line is continuous.
 */
export async function analytics() {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const since = new Date(startOfDay);
  since.setDate(since.getDate() - 6); // 7 buckets including today

  const [allAgg, todayAgg, recent, history] = await Promise.all([
    prisma.order.aggregate({ _sum: { totalAmount: true }, _count: true }),
    prisma.order.aggregate({
      where: { createdAt: { gte: startOfDay } },
      _sum: { totalAmount: true },
      _count: true,
    }),
    prisma.order.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true, totalAmount: true },
    }),
    prisma.order.findMany({
      where: { status: "DELIVERED" },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { items: true, user: true },
    }),
  ]);

  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate(),
    ).padStart(2, "0")}`;

  const buckets = new Map<string, number>();
  for (let i = 0; i < 7; i++) {
    const d = new Date(since);
    d.setDate(since.getDate() + i);
    buckets.set(fmt(d), 0);
  }
  for (const o of recent) {
    const key = fmt(o.createdAt);
    if (buckets.has(key)) buckets.set(key, buckets.get(key)! + o.totalAmount);
  }
  const trend = [...buckets.entries()].map(([_id, dailyRevenue]) => ({
    _id,
    dailyRevenue,
  }));

  return {
    total: {
      totalRevenue: allAgg._sum.totalAmount ?? 0,
      totalOrders: allAgg._count,
    },
    today: {
      todayRevenue: todayAgg._sum.totalAmount ?? 0,
      todayOrders: todayAgg._count,
    },
    trend,
    history: history.map((h) => serializeOrder(h)),
  };
}
