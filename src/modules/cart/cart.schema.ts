import { z } from "zod";

export const objectIdSchema = z
  .string()
  .regex(/^[a-f\d]{24}$/i, "Invalid resource id");

export const addCartItemSchema = z.object({
  productId: objectIdSchema,
  quantity: z.coerce.number().int().positive().max(99),
});

export const updateCartItemSchema = z.object({
  quantity: z.coerce.number().int().positive().max(99),
});

export type AddCartItemInput = z.infer<typeof addCartItemSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
