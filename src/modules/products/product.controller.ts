import type { Request, Response } from "express";
import * as productService from "./product.service.js";
import { listProductsQuerySchema } from "./product.schema.js";
import { uploadImageToS3 } from "../../utils/s3.js";
import { AppError } from "../../utils/AppError.js";

type ProductIdParams = {
  id: string;
};

export async function list(req: Request, res: Response) {
  const query = listProductsQuerySchema.parse(req.query);
  const result = await productService.listProducts(query);
  res.json(result);
}

export async function uploadImage(req: Request, res: Response) {
  if (!req.file) throw new AppError(400, "NO_FILE", "No image file was provided");
  const imageUrl = await uploadImageToS3(req.file.buffer, req.file.mimetype);
  res.status(201).json({ imageUrl });
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
