import type { Request, Response } from "express";
import * as orderService from "./order.service.js";

type OrderIdParams = { id: string };

export async function checkout(req: Request, res: Response) {
  const order = await orderService.checkout(req.user!.userId);
  res.status(201).json({ order });
}

export async function listMine(req: Request, res: Response) {
  res.json({ orders: await orderService.listMyOrders(req.user!.userId) });
}

export async function listAll(_req: Request, res: Response) {
  res.json({ orders: await orderService.listAllOrders() });
}

export async function getById(req: Request<OrderIdParams>, res: Response) {
  const order = await orderService.getOrder(req.params.id, req.user!.userId, req.user!.role === "admin");
  res.json({ order });
}

export async function cancel(req: Request<OrderIdParams>, res: Response) {
  const order = await orderService.cancelOrder(req.params.id, req.user!.userId, req.user!.role === "admin");
  res.json({ order });
}

export async function updateStatus(req: Request<OrderIdParams>, res: Response) {
  const order = await orderService.updateOrderStatus(req.params.id, req.body);
  res.json({ order });
}
