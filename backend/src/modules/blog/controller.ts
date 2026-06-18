import { asyncHandler } from "../../lib/asyncHandler";
import { ApiError } from "../../lib/ApiError";
import { prisma } from "../../db/prisma";
import * as blogService from "./service";

// ── Public ──
export const list = asyncHandler(async (_req, res) => {
  res.json({ posts: await blogService.listPublished() });
});

export const getOne = asyncHandler(async (req, res) => {
  const post = await blogService.getBySlug(req.params.slug as string);
  if (!post) throw ApiError.notFound("Post not found");
  res.json({ post });
});

// ── Admin ──
export const create = asyncHandler(async (req, res) => {
  const post = await prisma.blogPost.create({ data: req.body });
  res.status(201).json({ message: "Post created", post });
});
