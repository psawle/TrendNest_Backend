import { z } from "zod";

export const updateUserSchema = z.object({
  name: z.string().min(2).trim().optional(),
  email: z.string().email().toLowerCase().optional(),
  password: z.string().min(8, "Password must be at least 8 characters").optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
