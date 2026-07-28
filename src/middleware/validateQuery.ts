// src/middleware/validateQuery.ts
import type { Request, Response, NextFunction } from "express";
import type { ZodType } from "zod";

export const validateQuery =
  (schema: ZodType) => (req: Request, _res: Response, next: NextFunction) => {
    const parsed = schema.parse(req.query); // throws ZodError → errorHandler catches it
    Object.assign(req.query, parsed); // mutates in place; req.query is a getter in Express 5
    next();
  };