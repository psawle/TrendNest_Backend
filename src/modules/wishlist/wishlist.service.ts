import { WishlistItem } from "./wishlistItem.model.js";
import { Product } from "../products/product.model.js";
import { AppError } from "../../utils/AppError.js";
import type { AddWishlistItemInput } from "./wishlist.schema.js";

const wishlistProductSelection = "title pricePaise image stock category isActive";

export async function getWishlist(userId: string) {
  const items = await WishlistItem.find({ userId })
    .populate("productId", wishlistProductSelection)
    .sort({ createdAt: -1 });

  return { items };
}

export async function addWishlistItem(userId: string, input: AddWishlistItemInput) {
  const product = await Product.findById(input.productId);
  if (!product) throw new AppError(404, "PRODUCT_NOT_FOUND", "Product not found");

  const item = await WishlistItem.findOneAndUpdate(
    { userId, productId: input.productId },
    { $setOnInsert: { userId, productId: input.productId } },
    { new: true, upsert: true },
  ).populate("productId", wishlistProductSelection);

  return item;
}

export async function removeWishlistItem(userId: string, productId: string) {
  const item = await WishlistItem.findOneAndDelete({ userId, productId });
  if (!item) throw new AppError(404, "WISHLIST_ITEM_NOT_FOUND", "Item is not in your wishlist");
}
