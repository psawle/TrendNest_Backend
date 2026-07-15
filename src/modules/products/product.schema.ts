import { z } from "zod";

export const createProductSchema = z.object({
  title: z.string().min(2).trim(),
  description: z.string().min(10),
  pricePaise: z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  category: z.string().min(2).trim().toLowerCase(),
  image: z.string().url(),
  stock: z.coerce.number().int().nonnegative().default(0),
  isActive: z.boolean().default(true),
});

export const updateProductSchema = createProductSchema.partial();

export const listProductsQuerySchema = z.object({
  category: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(12),
  sort: z.enum(["price_asc", "price_desc", "newest"]).default("newest"),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;
