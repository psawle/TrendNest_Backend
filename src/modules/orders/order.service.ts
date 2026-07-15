import mongoose from "mongoose";
import { CartItem } from "../cart/cartItem.model.js";
import { Product } from "../products/product.model.js";
import { AppError } from "../../utils/AppError.js";
import { Order } from "./order.model.js";
import type { UpdateOrderStatusInput } from "./order.schema.js";

export async function checkout(userId: string) {
  const session = await mongoose.startSession();
  let order;

  try {
    await session.withTransaction(async () => {
      const cartItems = await CartItem.find({ userId }).session(session);
      if (cartItems.length === 0) throw new AppError(400, "CART_EMPTY", "Your cart is empty");

      const productIds = cartItems.map((item) => item.productId);
      const products = await Product.find({ _id: { $in: productIds } }).session(session);
      const productsById = new Map(products.map((product) => [product.id, product]));

      const items = cartItems.map((cartItem) => {
        const product = productsById.get(cartItem.productId.toString());
        if (!product) throw new AppError(400, "PRODUCT_UNAVAILABLE", "A cart product no longer exists");
        if (product.stock < cartItem.quantity) {
          throw new AppError(400, "INSUFFICIENT_STOCK", `${product.title} no longer has enough stock`);
        }
        return {
          productId: product._id,
          title: product.title,
          price: product.price,
          quantity: cartItem.quantity,
        };
      });

      // Conditional updates make the final stock deduction safe even if another checkout runs concurrently.
      for (const item of items) {
        const updated = await Product.findOneAndUpdate(
          { _id: item.productId, stock: { $gte: item.quantity } },
          { $inc: { stock: -item.quantity } },
          { new: true, session },
        );
        if (!updated) throw new AppError(400, "INSUFFICIENT_STOCK", "A product just went out of stock");
      }

      const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      [order] = await Order.create([{ userId, items, subtotal }], { session });
      await CartItem.deleteMany({ userId }).session(session);
    });
  } finally {
    await session.endSession();
  }

  return order!;
}

export async function listMyOrders(userId: string) {
  return Order.find({ userId }).sort({ createdAt: -1 });
}

export async function listAllOrders() {
  return Order.find().sort({ createdAt: -1 }).populate("userId", "name email");
}

export async function getOrder(orderId: string, userId: string, isAdmin: boolean) {
  const order = await Order.findById(orderId);
  if (!order) throw new AppError(404, "ORDER_NOT_FOUND", "Order not found");
  if (!isAdmin && order.userId.toString() !== userId) {
    throw new AppError(403, "FORBIDDEN", "You cannot access this order");
  }
  return order;
}

export async function cancelOrder(orderId: string, userId: string, isAdmin: boolean) {
  const session = await mongoose.startSession();
  let order;
  try {
    await session.withTransaction(async () => {
      order = await Order.findById(orderId).session(session);
      if (!order) throw new AppError(404, "ORDER_NOT_FOUND", "Order not found");
      if (!isAdmin && order.userId.toString() !== userId) {
        throw new AppError(403, "FORBIDDEN", "You cannot cancel this order");
      }
      if (order.status !== "pending") {
        throw new AppError(400, "ORDER_CANNOT_BE_CANCELLED", "Only pending orders can be cancelled");
      }
      order.status = "cancelled";
      await order.save({ session });
      await Promise.all(order.items.map((item) => Product.updateOne(
        { _id: item.productId }, { $inc: { stock: item.quantity } }, { session },
      )));
    });
  } finally {
    await session.endSession();
  }
  return order!;
}

export async function updateOrderStatus(orderId: string, input: UpdateOrderStatusInput) {
  const order = await Order.findById(orderId);
  if (!order) throw new AppError(404, "ORDER_NOT_FOUND", "Order not found");
  if (order.status === "cancelled" || order.status === "delivered") {
    throw new AppError(400, "ORDER_STATUS_FINAL", "A cancelled or delivered order cannot be changed");
  }
  const nextStatus = { pending: "paid", paid: "shipped", shipped: "delivered" } as const;
  if (nextStatus[order.status] !== input.status) {
    throw new AppError(400, "INVALID_ORDER_STATUS", "Order status must follow the fulfilment sequence");
  }
  order.status = input.status;
  await order.save();
  return order;
}
