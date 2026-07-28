import { z } from "zod";

export const createReviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().min(1).max(1000),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
