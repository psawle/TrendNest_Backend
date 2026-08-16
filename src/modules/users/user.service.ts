import bcrypt from "bcryptjs";
import { User } from "./user.model.js";
import { AppError } from "../../utils/AppError.js";
import type { UpdateUserInput } from "./user.schema.js";

export async function getUserById(id: string) {
  const user = await User.findById(id);
  if (!user) throw new AppError(404, "USER_NOT_FOUND", "User not found");
  return user;
}

export async function updateUser(id: string, input: UpdateUserInput) {
  const { password, ...rest } = input;
  const update: Record<string, unknown> = { ...rest };
  if (password) update.password = await bcrypt.hash(password, 12);

  const user = await User.findByIdAndUpdate(id, { $set: update }, { new: true, runValidators: true });
  if (!user) throw new AppError(404, "USER_NOT_FOUND", "User not found");
  return user;
}
