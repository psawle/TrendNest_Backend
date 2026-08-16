import { z } from "zod";
import { objectIdSchema } from "../../utils/objectId.schema.js";

export { objectIdSchema };

export const addCartItemSchema = z.object({
  productId: objectIdSchema,
  quantity: z.coerce.number().int().positive().max(99),
});

export const updateCartItemSchema = z.object({
  quantity: z.coerce.number().int().positive().max(99),
});

export type AddCartItemInput = z.infer<typeof addCartItemSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
