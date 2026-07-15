import { CartItem } from "./cartItem.model.js";
import { Product } from "../products/product.model.js";
import { AppError } from "../../utils/AppError.js";
import type { AddCartItemInput, UpdateCartItemInput } from "./cart.schema.js";

const cartProductSelection = "title pricePaise image stock category";

export async function getCart(userId: string) {
  const items = await CartItem.find({ userId })
    .populate("productId", cartProductSelection)
    .sort({ createdAt: -1 });

  return { items };
}

export async function addCartItem(userId: string, input: AddCartItemInput) {
  const product = await Product.findById(input.productId);
  if (!product) throw new AppError(404, "PRODUCT_NOT_FOUND", "Product not found");
  if (!product.isActive) throw new AppError(400, "PRODUCT_UNAVAILABLE", "Product is no longer available");
  if (product.stock < input.quantity) {
    throw new AppError(400, "INSUFFICIENT_STOCK", "Requested quantity is not available");
  }

  const item = await CartItem.findOneAndUpdate(
    { userId, productId: input.productId },
    { $set: { quantity: input.quantity } },
    { new: true, upsert: true, runValidators: true },
  ).populate("productId", cartProductSelection);

  return item;
}

export async function updateCartItem(userId: string, productId: string, input: UpdateCartItemInput) {
  const product = await Product.findById(productId);
  if (!product) throw new AppError(404, "PRODUCT_NOT_FOUND", "Product not found");
  if (!product.isActive) throw new AppError(400, "PRODUCT_UNAVAILABLE", "Product is no longer available");
  if (product.stock < input.quantity) {
    throw new AppError(400, "INSUFFICIENT_STOCK", "Requested quantity is not available");
  }

  const item = await CartItem.findOneAndUpdate(
    { userId, productId },
    { $set: { quantity: input.quantity } },
    { new: true, runValidators: true },
  ).populate("productId", cartProductSelection);
  if (!item) throw new AppError(404, "CART_ITEM_NOT_FOUND", "Item is not in your cart");

  return item;
}

export async function removeCartItem(userId: string, productId: string) {
  const item = await CartItem.findOneAndDelete({ userId, productId });
  if (!item) throw new AppError(404, "CART_ITEM_NOT_FOUND", "Item is not in your cart");
}

export async function clearCart(userId: string) {
  await CartItem.deleteMany({ userId });
}
