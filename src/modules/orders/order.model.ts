import { Schema, model, Types } from "mongoose";

export interface IOrderItem {
  productId: Types.ObjectId;
  title: string;
  pricePaise: number;
  quantity: number;
}

export interface IOrder {
  userId: Types.ObjectId;
  items: IOrderItem[];
  subtotalPaise: number;
  status: "pending" | "paid" | "shipped" | "delivered" | "cancelled";
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    title: { type: String, required: true },
    pricePaise: {
      type: Number,
      required: true,
      min: 1,
      validate: { validator: Number.isSafeInteger, message: "Price must be a safe integer number of paise" },
    },
    quantity: { type: Number, required: true, min: 1 },
  },
  {
    _id: false,
    // Mirrors the product API's rupee/paise boundary: pricePaise is internal storage only.
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, unknown>) => {
        delete ret.pricePaise;
      },
    },
  }
);

orderItemSchema.virtual("price").get(function (this: IOrderItem) {
  return this.pricePaise / 100;
});

const orderSchema = new Schema<IOrder>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    items: { type: [orderItemSchema], required: true },
    subtotalPaise: {
      type: Number,
      required: true,
      min: 1,
      validate: { validator: Number.isSafeInteger, message: "Subtotal must be a safe integer number of paise" },
    },
    status: {
      type: String,
      enum: ["pending", "paid", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.subtotalPaise;
      },
    },
  }
);

orderSchema.virtual("subtotal").get(function (this: IOrder) {
  return this.subtotalPaise / 100;
});

export const Order = model<IOrder>("Order", orderSchema);
