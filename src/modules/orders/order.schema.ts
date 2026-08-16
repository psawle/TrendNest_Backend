import { z } from "zod";
import { objectIdSchema } from "../../utils/objectId.schema.js";

export const orderIdSchema = objectIdSchema;

export const updateOrderStatusSchema = z.object({
  status: z.enum(["paid", "shipped", "delivered"]),
});

export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
