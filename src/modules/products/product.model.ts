import { Schema, model } from "mongoose";

export interface IProduct {
  title: string;
  description: string;
  pricePaise: number;
  category: string;
  image: string;
  stock: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    pricePaise: {
      type: Number,
      required: true,
      min: [1, "Price must be at least 1 paise"],
      validate: { validator: Number.isSafeInteger, message: "Price must be a safe integer number of paise" },
    },
    category: { type: String, required: true, lowercase: true, index: true },
    image: { type: String, required: true },
    stock: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true, index: true },
  },
  {
    timestamps: true,
    // The API contract is decimal rupees; pricePaise is an internal storage detail
    // that stays out of every response so the frontend never has to convert it.
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.pricePaise;
      },
    },
  }
);

productSchema.index({ title: "text", description: "text" });

productSchema.virtual("price").get(function (this: IProduct) {
  return this.pricePaise / 100;
});

export const Product = model<IProduct>("Product", productSchema);
