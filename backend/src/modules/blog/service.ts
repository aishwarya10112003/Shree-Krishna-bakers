import { prisma } from "../../db/prisma";

export async function listPublished() {
  return prisma.blogPost.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getBySlug(slug: string) {
  return prisma.blogPost.findFirst({ where: { slug, published: true } });
}
