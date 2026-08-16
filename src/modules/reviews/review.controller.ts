import type { Request, Response } from "express";
import * as reviewService from "./review.service.js";

type ProductIdParams = { id: string };

export async function list(req: Request<ProductIdParams>, res: Response) {
  res.json(await reviewService.listReviews(req.params.id));
}

export async function create(req: Request<ProductIdParams>, res: Response) {
  const review = await reviewService.createReview(req.params.id, req.user!.userId, req.body);
  res.status(201).json({ review });
}
