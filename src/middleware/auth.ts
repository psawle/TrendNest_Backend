import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt.js";
import { AppError } from "../utils/AppError.js";

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    throw new AppError(401, "UNAUTHORIZED", "Authentication required");
  }
  try {
    req.user = verifyAccessToken(header.slice(7)); // strip "Bearer "
  } catch {
    throw new AppError(401, "TOKEN_EXPIRED", "Token invalid or expired");
  }
  next();
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (req.user?.role !== "admin") {
    throw new AppError(403, "FORBIDDEN", "Admin access required");
  }
  next();
}