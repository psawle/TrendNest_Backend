import type { Request, Response } from "express";
import * as wishlistService from "./wishlist.service.js";

type ProductIdParams = { productId: string };

export async function get(req: Request, res: Response) {
  res.json(await wishlistService.getWishlist(req.user!.userId));
}

export async function add(req: Request, res: Response) {
  const item = await wishlistService.addWishlistItem(req.user!.userId, req.body);
  res.status(201).json({ item });
}

export async function remove(req: Request<ProductIdParams>, res: Response) {
  await wishlistService.removeWishlistItem(req.user!.userId, req.params.productId);
  res.status(204).send();
}
