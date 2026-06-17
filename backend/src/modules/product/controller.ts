import type { Request } from "express";
import { asyncHandler } from "../../lib/asyncHandler";
import * as productService from "./service";

const buildCtx = (req: Request) => ({
  actorId: req.user?.id ?? null,
  ip: req.ip ?? null,
});

// ── Public ──────────────────────────────────────────────────────────────
export const getMenu = asyncHandler(async (_req, res) => {
  res.json({ products: await productService.getMenu() }); // cached
});

export const getBestsellers = asyncHandler(async (_req, res) => {
  res.json({ products: await productService.listBestsellers() });
});

// ── Admin ───────────────────────────────────────────────────────────────
export const getAdminProducts = asyncHandler(async (_req, res) => {
  res.json({ products: await productService.listProducts() });
});

export const addProduct = asyncHandler(async (req, res) => {
  const product = await productService.createProduct(req.body, buildCtx(req));
  res.status(201).json({ message: "Product added successfully!", product });
});

export const addBulk = asyncHandler(async (req, res) => {
  const items = await productService.bulkCreate(req.body, buildCtx(req));
  res.status(201).json({ message: "Menu updated successfully!", count: items.length, items });
});

export const removeProduct = asyncHandler(async (req, res) => {
  await productService.removeProduct(req.params.id as string, buildCtx(req));
  res.json({ message: "Product deleted successfully" });
});

export const toggleStock = asyncHandler(async (req, res) => {
  const product = await productService.toggleStock(req.params.id as string, buildCtx(req));
  res.json({
    message: `Product is now ${product.isAvailable ? "Available" : "Out of Stock"}`,
    product,
  });
});
