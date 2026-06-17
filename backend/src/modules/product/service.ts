import { prisma } from "../../db/prisma";
import { ApiError } from "../../lib/ApiError";
import { audit } from "../../lib/audit";
import { cached, invalidate, CACHE_KEYS } from "../../lib/cache";
import { serializeProduct } from "../../lib/serialize";
import type { ProductInput } from "./schemas";

/** Who performed an action — passed in for audit logging. */
type ActorCtx = { actorId?: string | null; ip?: string | null };

const MENU_TTL = 60; // seconds

/** Raw DB read (soft-deleted products auto-excluded by the Prisma extension). */
async function fetchAllProducts() {
  const products = await prisma.product.findMany({ orderBy: { createdAt: "asc" } });
  return products.map(serializeProduct);
}

/** Admin list — always fresh (admins are actively editing). */
export async function listProducts() {
  return fetchAllProducts();
}

/** Public menu — READ-HEAVY, so it's cached in Redis (cache-aside). */
export async function getMenu() {
  return cached(CACHE_KEYS.menu, MENU_TTL, fetchAllProducts);
}

/** Public bestsellers — also cached. */
export async function listBestsellers() {
  return cached(CACHE_KEYS.bestsellers, MENU_TTL, async () => {
    const products = await prisma.product.findMany({
      where: { isBestseller: true, isAvailable: true },
      orderBy: { createdAt: "asc" },
    });
    return products.map(serializeProduct);
  });
}

/** Any product write must drop the public caches so customers see fresh data. */
async function invalidateMenuCaches() {
  await invalidate(CACHE_KEYS.menu, CACHE_KEYS.bestsellers);
}

export async function createProduct(data: ProductInput, ctx: ActorCtx) {
  const product = await prisma.product.create({
    data: { ...data, stockQuantity: data.stockQuantity ?? 0 },
  });
  await invalidateMenuCaches();
  await audit({
    actorId: ctx.actorId,
    action: "product.create",
    entity: "Product",
    entityId: product.id,
    metadata: { name: product.name },
    ip: ctx.ip,
  });
  return serializeProduct(product);
}

export async function bulkCreate(items: ProductInput[], ctx: ActorCtx) {
  const created = await prisma.$transaction((tx) =>
    Promise.all(
      items.map((p) =>
        tx.product.create({ data: { ...p, stockQuantity: p.stockQuantity ?? 0 } }),
      ),
    ),
  );
  await invalidateMenuCaches();
  await audit({
    actorId: ctx.actorId,
    action: "product.bulk_create",
    entity: "Product",
    metadata: { count: created.length },
    ip: ctx.ip,
  });
  return created.map(serializeProduct);
}

/** Soft delete: history-safe. The row stays; reads just stop returning it. */
export async function removeProduct(id: string, ctx: ActorCtx) {
  const product = await prisma.product.findFirst({ where: { id } });
  if (!product) throw ApiError.notFound("Product not found");
  await prisma.product.softDelete(id);
  await invalidateMenuCaches();
  await audit({
    actorId: ctx.actorId,
    action: "product.delete",
    entity: "Product",
    entityId: id,
    metadata: { name: product.name },
    ip: ctx.ip,
  });
}

export async function toggleStock(id: string, ctx: ActorCtx) {
  const product = await prisma.product.findFirst({ where: { id } });
  if (!product) throw ApiError.notFound("Product not found");
  const updated = await prisma.product.update({
    where: { id },
    data: { isAvailable: !product.isAvailable },
  });
  await invalidateMenuCaches();
  await audit({
    actorId: ctx.actorId,
    action: "product.toggle_stock",
    entity: "Product",
    entityId: id,
    metadata: { isAvailable: updated.isAvailable },
    ip: ctx.ip,
  });
  return serializeProduct(updated);
}
