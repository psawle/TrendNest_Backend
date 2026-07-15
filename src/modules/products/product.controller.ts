import type { Request, Response } from "express";
import * as productService from "./product.service.js";
import { listProductsQuerySchema } from "./product.schema.js";

type ProductIdParams = {
  id: string;
};

export async function list(req: Request, res: Response) {
  const query = listProductsQuerySchema.parse(req.query);
  const result = await productService.listProducts(query);
  res.json(result);
}

export async function create(req: Request, res: Response) {
  const product = await productService.createProduct(req.body);
  res.status(201).json({ product });
}

export async function getById(
  req: Request<ProductIdParams>,
  res: Response,
) {
  const product = await productService.getProductById(req.params.id);
  res.json({ product });
}

export async function update(
  req: Request<ProductIdParams>,
  res: Response,
) {
  const product = await productService.updateProduct(req.params.id, req.body);
  res.json({ product });
}

export async function remove(
  req: Request<ProductIdParams>,
  res: Response,
) {
  await productService.deleteProduct(req.params.id);
  res.status(204).send();
}
