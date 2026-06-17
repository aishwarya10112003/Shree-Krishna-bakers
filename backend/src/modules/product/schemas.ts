import { z } from "zod";

/**
 * `z.coerce.number()` is deliberate: the AddDishModal form sends `price` as a
 * STRING ("450"). Coercion turns it into a number before validation, so the old
 * latent "Expected number, received string" failure can't happen.
 */
export const productSchema = z.object({
  name: z.string().min(1, "Product name is required").max(100),
  price: z.coerce.number().int().positive("Price must be positive"),
  category: z.string().min(1, "Category is required").max(50),
  image: z.string().min(1, "Image is required"),
  description: z.string().max(500).optional(),
  isAvailable: z.boolean().optional(),
  isBestseller: z.boolean().optional(),
  stockQuantity: z.coerce.number().int().nonnegative().optional(),
});

export const bulkProductsSchema = z
  .array(productSchema)
  .min(1, "At least one product required");

export type ProductInput = z.infer<typeof productSchema>;
