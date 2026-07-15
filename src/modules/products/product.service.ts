import { Product } from "./product.model.js";
import mongoose from "mongoose";
import { CartItem } from "../cart/cartItem.model.js";
import { AppError } from "../../utils/AppError.js";
import type { CreateProductInput, UpdateProductInput, ListProductsQuery } from "./product.schema.js";

export async function listProducts(query: ListProductsQuery) {
  const filter: Record<string, unknown> = { isActive: true };
  if (query.category) filter.category = query.category.toLowerCase();
  if (query.search) filter.$text = { $search: query.search };

  const sortMap = {
    price_asc: { pricePaise: 1 as const },
    price_desc: { pricePaise: -1 as const },
    newest: { createdAt: -1 as const },
  };

  const skip = (query.page - 1) * query.limit;

  const [products, total] = await Promise.all([
    Product.find(filter).sort(sortMap[query.sort]).skip(skip).limit(query.limit),
    Product.countDocuments(filter),
  ]);

  return {
    products,
    pagination: { page: query.page, limit: query.limit, total, pages: Math.ceil(total / query.limit) },
  };
}

export async function getProductById(id: string) {
  const product = await Product.findOne({ _id: id, isActive: true });
  if (!product) throw new AppError(404, "PRODUCT_NOT_FOUND", "Product not found");
  return product;
}

export async function createProduct(input: CreateProductInput) {
  return Product.create(input);
}

export async function updateProduct(id: string, input: UpdateProductInput) {
  const product = await Product.findByIdAndUpdate(id, input, { new: true, runValidators: true });
  if (!product) throw new AppError(404, "PRODUCT_NOT_FOUND", "Product not found");
  return product;
}

export async function deleteProduct(id: string) {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      // Preserve the product for order history and cancellation/restocking, while
      // removing it from sale and from carts before it can block checkout.
      const product = await Product.findOneAndUpdate(
        { _id: id, isActive: true },
        { $set: { isActive: false } },
        { new: true, session },
      );
      if (!product) throw new AppError(404, "PRODUCT_NOT_FOUND", "Product not found");
      await CartItem.deleteMany({ productId: id }).session(session);
    });
  } finally {
    await session.endSession();
  }
}
