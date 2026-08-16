import { Schema, model, Types } from "mongoose";

export interface IReview {
  productId: Types.ObjectId;
  userId: Types.ObjectId;
  rating: number;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true, maxlength: 1000 },
  },
  { timestamps: true }
);

// One review per user per product; resubmitting should edit, not duplicate.
reviewSchema.index({ productId: 1, userId: 1 }, { unique: true });

export const Review = model<IReview>("Review", reviewSchema);
