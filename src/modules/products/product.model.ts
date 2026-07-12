import { Schema, model } from "mongoose";

export interface IProduct {
  title: string;
  description: string;
  price: number;
  category: string;
  image: string;
  stock: number;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: [1, "Price must be at least 1"] },
    category: { type: String, required: true, lowercase: true, index: true },
    image: { type: String, required: true },
    stock: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

productSchema.index({ title: "text", description: "text" });

export const Product = model<IProduct>("Product", productSchema);