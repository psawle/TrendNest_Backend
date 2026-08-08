import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import { User } from "../modules/users/user.model.js";

async function makeAdmin() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email) {
    throw new Error("Usage: npm run make-admin -- <email>");
  }

  await connectDB();

  const user = await User.findOneAndUpdate({ email }, { role: "admin" }, { new: true });
  if (!user) throw new Error(`No user found with email ${email}`);

  console.log(`${user.email} is now an admin.`);
}

makeAdmin()
  .catch((error: unknown) => {
    console.error("make-admin failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
