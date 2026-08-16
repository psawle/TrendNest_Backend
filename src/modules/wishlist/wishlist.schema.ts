import { z } from "zod";
import { objectIdSchema } from "../../utils/objectId.schema.js";

export const addWishlistItemSchema = z.object({
  productId: objectIdSchema,
});

export type AddWishlistItemInput = z.infer<typeof addWishlistItemSchema>;
