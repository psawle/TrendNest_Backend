import { Router } from "express";
import rateLimit from "express-rate-limit";
import * as ctrl from "./auth.controller.js";
import { validate } from "../../middleware/validate.js";
import { registerSchema, loginSchema } from "./auth.schema.js";

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, message: { error: { code: "RATE_LIMITED", message: "Too many attempts, try again later" } } });

const router = Router();
router.post("/register", authLimiter, validate(registerSchema), ctrl.register);
router.post("/login", authLimiter, validate(loginSchema), ctrl.login);
router.post("/refresh", ctrl.refresh);
router.post("/logout", ctrl.logout);

export default router;