// src/middleware/validateQuery.ts
import type { Request, Response, NextFunction } from "express";
import type { ZodType } from "zod";

export const validateQuery =
  (schema: ZodType) => (req: Request, _res: Response, next: NextFunction) => {
    req.query = schema.parse(req.query) as any;
    next();
  };