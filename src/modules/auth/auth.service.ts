import bcrypt from "bcryptjs";
import { createHash } from "node:crypto";
import { User } from "../users/user.model.js";
import { AppError } from "../../utils/AppError.js";
import { signAccessToken, signRefreshToken } from "../../utils/jwt.js";
import { RefreshSession } from "./refreshSession.model.js";
import type { RegisterInput, LoginInput } from "./auth.schema.js";

export async function registerUser(input: RegisterInput) {
  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await User.create({ ...input, password: passwordHash });
  return user; // toJSON transform strips the hash on the way out
}

export async function loginUser(input: LoginInput) {
  const user = await User.findOne({ email: input.email }).select("+password");
  const valid = user && (await bcrypt.compare(input.password, user.password));
  if (!valid || !user.isActive) {
    throw new AppError(401, "INVALID_CREDENTIALS", "Invalid email or password");
  }

  const payload = { userId: user.id, role: user.role };
  return {
    user,
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
  };
}

export const hashRefreshToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

export async function createRefreshSession(userId: string, refreshToken: string, expiresAt: Date) {
  await RefreshSession.create({
    userId,
    tokenHash: hashRefreshToken(refreshToken),
    expiresAt,
  });
}

/**
 * Replacing the hash in one conditional update makes a refresh token single-use:
 * two concurrent requests with the same token cannot both succeed.
 */
export async function rotateRefreshSession(
  userId: string,
  currentToken: string,
  nextToken: string,
  expiresAt: Date,
) {
  return RefreshSession.findOneAndUpdate(
    { userId, tokenHash: hashRefreshToken(currentToken) },
    { $set: { tokenHash: hashRefreshToken(nextToken), expiresAt } },
    { new: true },
  );
}

export async function revokeRefreshSession(token: string) {
  await RefreshSession.deleteOne({ tokenHash: hashRefreshToken(token) });
}
