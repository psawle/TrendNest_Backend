import type { Request, Response } from "express";
import * as cartService from "./cart.service.js";

type ProductIdParams = { productId: string };

export async function get(req: Request, res: Response) {
  res.json(await cartService.getCart(req.user!.userId));
}

export async function add(req: Request, res: Response) {
  const item = await cartService.addCartItem(req.user!.userId, req.body);
  res.status(201).json({ item });
}

export async function update(req: Request<ProductIdParams>, res: Response) {
  const item = await cartService.updateCartItem(req.user!.userId, req.params.productId, req.body);
  res.json({ item });
}

export async function remove(req: Request<ProductIdParams>, res: Response) {
  await cartService.removeCartItem(req.user!.userId, req.params.productId);
  res.status(204).send();
}

export async function clear(req: Request, res: Response) {
  await cartService.clearCart(req.user!.userId);
  res.status(204).send();
}
