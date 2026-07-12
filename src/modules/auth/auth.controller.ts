import type { Request, Response } from "express";
import * as authService from "./auth.service.js";
import { verifyRefreshToken, signAccessToken, signRefreshToken } from "../../utils/jwt.js";
import { AppError } from "../../utils/AppError.js";
import { env } from "../../config/env.js";

const REFRESH_COOKIE = "refreshToken";
const cookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/api/v1/auth",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export async function register(req: Request, res: Response) {
  const user = await authService.registerUser(req.body);
  res.status(201).json({ user });
}

export async function login(req: Request, res: Response) {
  const { user, accessToken, refreshToken } = await authService.loginUser(req.body);
  res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions);
  res.json({ user, accessToken });
}

export async function refresh(req: Request, res: Response) {
  const token = req.cookies[REFRESH_COOKIE];
  if (!token) throw new AppError(401, "NO_REFRESH_TOKEN", "Not authenticated");
  try {
    const { userId, role } = verifyRefreshToken(token);
    res.cookie(REFRESH_COOKIE, signRefreshToken({ userId, role }), cookieOptions); // rotation
    res.json({ accessToken: signAccessToken({ userId, role }) });
  } catch {
    throw new AppError(401, "INVALID_REFRESH_TOKEN", "Session expired, please log in again");
  }
}

export async function logout(_req: Request, res: Response) {
  res.clearCookie(REFRESH_COOKIE, { path: "/api/v1/auth" });
  res.status(204).send();
}