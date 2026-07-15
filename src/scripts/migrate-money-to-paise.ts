import mongoose, { Types } from "mongoose";
import { connectDB } from "../config/db.js";
import { Product } from "../modules/products/product.model.js";
import { Order } from "../modules/orders/order.model.js";

type LegacyOrderItem = {
  productId: Types.ObjectId;
  title: string;
  price: unknown;
  quantity: number;
};

type LegacyOrder = {
  _id: Types.ObjectId;
  items: LegacyOrderItem[];
};

function rupeesToPaise(value: unknown, label: string) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${label} is not a finite number`);
  }
  const paise = Math.round((value + Number.EPSILON) * 100);
  if (!Number.isSafeInteger(paise) || paise < 1) {
    throw new Error(`${label} cannot be converted to a positive safe paise value`);
  }
  return paise;
}

async function migrate() {
  await connectDB();

  // The previous API stored rupee amounts in `price`; this one-time migration
  // converts them to integer paise and removes the ambiguous legacy fields.
  const products = await Product.collection
    .find<{ _id: Types.ObjectId; price: unknown }>({ pricePaise: { $exists: false }, price: { $exists: true } })
    .toArray();
  if (products.length > 0) {
    await Product.collection.bulkWrite(products.map((product) => ({
      updateOne: {
        filter: { _id: product._id },
        update: { $set: { pricePaise: rupeesToPaise(product.price, `Product ${product._id} price`) }, $unset: { price: "" } },
      },
    })));
  }

  const orders = await Order.collection
    .find<LegacyOrder>({ "items.price": { $exists: true } })
    .toArray();
  if (orders.length > 0) {
    await Order.collection.bulkWrite(orders.map((order) => {
      const items = order.items.map(({ price, ...item }) => ({
        ...item,
        pricePaise: rupeesToPaise(price, `Order ${order._id} item price`),
      }));
      const subtotalPaise = items.reduce((sum, item) => sum + item.pricePaise * item.quantity, 0);
      return {
        updateOne: {
          filter: { _id: order._id },
          update: { $set: { items, subtotalPaise }, $unset: { subtotal: "" } },
        },
      };
    }));
  }

  console.log(`Migrated ${products.length} products and ${orders.length} orders to paise.`);
}

migrate()
  .catch((error: unknown) => {
    console.error("Money migration failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
