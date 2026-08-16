import mongoose from "mongoose";
import { Product } from "../products/product.model.js";
import { Review } from "./review.model.js";
import { AppError } from "../../utils/AppError.js";
import type { CreateReviewInput } from "./review.schema.js";

export async function listReviews(productId: string) {
  const [reviews, summary] = await Promise.all([
    Review.find({ productId }).populate("userId", "name").sort({ createdAt: -1 }),
    Review.aggregate([
      { $match: { productId: new mongoose.Types.ObjectId(productId) } },
      { $group: { _id: null, average: { $avg: "$rating" }, count: { $sum: 1 } } },
    ]),
  ]);

  const { average = 0, count = 0 } = summary[0] ?? {};
  return { reviews, summary: { average: Math.round(average * 10) / 10, count } };
}

export async function createReview(productId: string, userId: string, input: CreateReviewInput) {
  const product = await Product.findOne({ _id: productId, isActive: true });
  if (!product) throw new AppError(404, "PRODUCT_NOT_FOUND", "Product not found");

  return Review.create({ productId, userId, ...input });
}
