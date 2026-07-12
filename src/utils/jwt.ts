import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export interface TokenPayload {
  userId: string;
  role: "customer" | "admin";
}

export const signAccessToken = (p: TokenPayload) =>
  jwt.sign(p, env.JWT_ACCESS_SECRET, { expiresIn: env.JWT_ACCESS_EXPIRY } as jwt.SignOptions);

export const signRefreshToken = (p: TokenPayload) =>
  jwt.sign(p, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRY } as jwt.SignOptions);

export const verifyAccessToken = (t: string) => jwt.verify(t, env.JWT_ACCESS_SECRET) as jwt.JwtPayload & TokenPayload;
export const verifyRefreshToken = (t: string) => jwt.verify(t, env.JWT_REFRESH_SECRET) as jwt.JwtPayload & TokenPayload;