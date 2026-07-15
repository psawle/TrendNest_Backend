import mongoose from "mongoose";
import { env } from "./env.js";

mongoose.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret: Record<string, unknown>) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.password;
  },
});

export async function connectDB(): Promise<void> {
  try {
    await mongoose.connect(env.MONGODB_URI);

    // Checkout and cancellation update multiple collections atomically. MongoDB only
    // supports those transactions on a replica set (or a sharded cluster), never a
    // standalone mongod process.
    const db = mongoose.connection.db;
    if (!db) throw new Error("MongoDB connection was not initialized");
    const topology = await db.admin().command({ hello: 1 });
    if (!topology.setName && topology.msg !== "isdbgrid") {
      throw new Error(
        "MongoDB transactions require a replica set. Start MongoDB with --replSet rs0 and use a URI containing ?replicaSet=rs0.",
      );
    }

    console.log("MongoDB connected:", mongoose.connection.name);
  } catch (err) {
    console.error("MongoDB connection failed:", err);
    process.exit(1); // no point serving requests without a database
  }
}
