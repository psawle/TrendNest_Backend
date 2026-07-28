import { Schema, model, Types } from "mongoose";

export interface IWishlistItem {
  userId: Types.ObjectId;
  productId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const wishlistItemSchema = new Schema<IWishlistItem>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  },
  { timestamps: true }
);

wishlistItemSchema.index({ userId: 1, productId: 1 }, { unique: true });

export const WishlistItem = model<IWishlistItem>("WishlistItem", wishlistItemSchema);
