// src/middleware/errorHandler.ts
import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/AppError.js";

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: { code: err.code, message: err.message } });
  }
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: { code: "VALIDATION_ERROR", message: err.issues.map(i => `${i.path.join(".")}: ${i.message}`).join("; ") },
    });
  }
  if (typeof err === "object" && err !== null && (err as any).code === 11000) {
    return res.status(409).json({ error: { code: "DUPLICATE", message: "Resource already exists" } });
  }
  console.error(err);
  return res.status(500).json({ error: { code: "INTERNAL", message: "Something went wrong" } });
}