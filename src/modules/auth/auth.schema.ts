// src/modules/auth/auth.schema.ts
import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2).trim(),
  email: z.string().email().toLowerCase(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const loginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;