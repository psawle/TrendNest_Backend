import { z } from "zod";

export const orderIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid order id");

export const updateOrderStatusSchema = z.object({
  status: z.enum(["paid", "shipped", "delivered"]),
});

export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
