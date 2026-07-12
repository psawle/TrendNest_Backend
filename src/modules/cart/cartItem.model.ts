import { Schema, model, Types } from "mongoose";

export interface ICartItem {
  userId: Types.ObjectId;
  productId: Types.ObjectId;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
}

const cartItemSchema = new Schema<ICartItem>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { timestamps: true }
);

cartItemSchema.index({ userId: 1, productId: 1 }, { unique: true });

export const CartItem = model<ICartItem>("CartItem", cartItemSchema);