import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "node:crypto";
import { User } from "../users/user.model.js";
import { AppError } from "../../utils/AppError.js";
import { signAccessToken, signRefreshToken } from "../../utils/jwt.js";
import { RefreshSession } from "./refreshSession.model.js";
import { PasswordResetToken } from "./passwordResetToken.model.js";
import type { RegisterInput, LoginInput } from "./auth.schema.js";

const PASSWORD_RESET_TTL_MS = 15 * 60 * 1000;

export async function registerUser(input: RegisterInput) {
  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await User.create({ ...input, password: passwordHash }); // toJSON transform strips the hash on the way out

  const payload = { userId: user.id, role: user.role };
  return {
    user,
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
  };
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

const hashResetToken = (token: string) => createHash("sha256").update(token).digest("hex");

/**
 * Returns null when the email doesn't match a user so the controller can send an
 * identical response either way — confirming/denying an email's existence is an
 * enumeration leak.
 */
export async function requestPasswordReset(email: string) {
  const user = await User.findOne({ email });
  if (!user) return null;

  const token = randomBytes(32).toString("hex");
  // A fresh request invalidates any reset link issued earlier.
  await PasswordResetToken.deleteMany({ userId: user.id });
  await PasswordResetToken.create({
    userId: user.id,
    tokenHash: hashResetToken(token),
    expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
  });

  return token;
}

export async function resetPassword(token: string, newPassword: string) {
  const resetRecord = await PasswordResetToken.findOne({
    tokenHash: hashResetToken(token),
    expiresAt: { $gt: new Date() },
  });
  if (!resetRecord) throw new AppError(400, "INVALID_RESET_TOKEN", "Reset token is invalid or expired");

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await User.findByIdAndUpdate(resetRecord.userId, { password: passwordHash });

  await Promise.all([
    PasswordResetToken.deleteOne({ _id: resetRecord._id }),
    // A password reset should end every existing session, not just future logins.
    RefreshSession.deleteMany({ userId: resetRecord.userId }),
  ]);
}
