import bcrypt from "bcryptjs";
import { User } from "../user/user.model.js";
import { AppError } from "../../utils/AppError.js";
import { signAccessToken, signRefreshToken } from "../../utils/jwt.js";
import type { RegisterInput, LoginInput } from "./auth.schema.js";

export async function registerUser(input: RegisterInput) {
  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await User.create({ ...input, password: passwordHash });
  return user; // toJSON transform strips the hash on the way out
}

export async function loginUser(input: LoginInput) {
  const user = await User.findOne({ email: input.email }).select("+password");
  const valid = user && (await bcrypt.compare(input.password, user.password));
  if (!valid) throw new AppError(401, "INVALID_CREDENTIALS", "Invalid email or password");

  const payload = { userId: user.id, role: user.role };
  return {
    user,
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
  };
}