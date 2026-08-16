import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import * as authService from "./auth.service.js";
import { verifyRefreshToken, signAccessToken, signRefreshToken } from "../../utils/jwt.js";
import { AppError } from "../../utils/AppError.js";
import { env } from "../../config/env.js";
import { User } from "../users/user.model.js";

const REFRESH_COOKIE = "refreshToken";
const cookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/api/v1/auth",
};

function refreshTokenExpiry(token: string) {
  const { exp } = verifyRefreshToken(token);
  if (!exp) throw new AppError(500, "INVALID_REFRESH_CONFIG", "Refresh token expiry is missing");
  return new Date(exp * 1000);
}

function refreshCookieOptions(expiresAt: Date) {
  return { ...cookieOptions, maxAge: Math.max(0, expiresAt.getTime() - Date.now()) };
}

async function issueSession(res: Response, user: InstanceType<typeof User>, accessToken: string, refreshToken: string) {
  const expiresAt = refreshTokenExpiry(refreshToken);
  await authService.createRefreshSession(user.id, refreshToken, expiresAt);
  res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions(expiresAt));
  return { user, accessToken };
}

export async function register(req: Request, res: Response) {
  const { user, accessToken, refreshToken } = await authService.registerUser(req.body);
  res.status(201).json(await issueSession(res, user, accessToken, refreshToken));
}

export async function login(req: Request, res: Response) {
  const { user, accessToken, refreshToken } = await authService.loginUser(req.body);
  res.json(await issueSession(res, user, accessToken, refreshToken));
}

export async function refresh(req: Request, res: Response) {
  const token = req.cookies[REFRESH_COOKIE];
  if (!token) throw new AppError(401, "NO_REFRESH_TOKEN", "Not authenticated");
  try {
    const { userId } = verifyRefreshToken(token);
    const user = await User.findById(userId);
    if (!user || !user.isActive) {
      await authService.revokeRefreshSession(token);
      throw new AppError(401, "SESSION_REVOKED", "Session is no longer valid");
    }

    // Use the current database role, not the possibly stale role embedded in the token.
    const payload = { userId: user.id, role: user.role };
    const refreshToken = signRefreshToken(payload);
    const expiresAt = refreshTokenExpiry(refreshToken);

    const session = await authService.rotateRefreshSession(
      user.id,
      token,
      refreshToken,
      expiresAt,
    );
    if (!session) throw new AppError(401, "INVALID_REFRESH_TOKEN", "Session expired, please log in again");

    res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions(expiresAt));
    res.json({ accessToken: signAccessToken(payload) });
  } catch (error) {
    if (error instanceof AppError) throw error;
    // jwt.verify throws for expired/tampered tokens (expected); anything else is a real failure worth keeping in the logs.
    if (!(error instanceof jwt.JsonWebTokenError)) console.error("Unexpected error during token refresh:", error);
    throw new AppError(401, "INVALID_REFRESH_TOKEN", "Session expired, please log in again");
  }
}

export async function logout(req: Request, res: Response) {
  const token = req.cookies[REFRESH_COOKIE];
  if (token) await authService.revokeRefreshSession(token);
  res.clearCookie(REFRESH_COOKIE, { path: "/api/v1/auth" });
  res.status(204).send();
}

export async function forgotPassword(req: Request, res: Response) {
  const token = await authService.requestPasswordReset(req.body.email);
  const body: { message: string; resetToken?: string } = {
    message: "If that email is registered, a password reset link has been issued",
  };
  // No email sender is wired up yet: surface the raw token outside production so the
  // flow is testable end-to-end. Remove this once real delivery replaces it.
  if (token && env.NODE_ENV !== "production") body.resetToken = token;
  res.json(body);
}

export async function resetPassword(req: Request, res: Response) {
  await authService.resetPassword(req.body.token, req.body.password);
  res.json({ message: "Password updated successfully" });
}
