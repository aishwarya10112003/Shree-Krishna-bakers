import { z } from "zod";

export const blogSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9-]+$/, "slug must be lowercase letters, digits and hyphens"),
  title: z.string().min(1).max(200),
  excerpt: z.string().max(300).optional(),
  content: z.string().min(1),
  coverImage: z.string().optional(),
  published: z.boolean().optional(),
});

export type BlogInput = z.infer<typeof blogSchema>;
