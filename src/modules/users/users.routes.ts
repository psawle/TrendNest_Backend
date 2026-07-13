// src/modules/users/users.routes.ts
import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { User } from "./user.model.js";
import { AppError } from "../../utils/AppError.js";

const router = Router();

router.get("/me", requireAuth, async (req, res) => {
  const user = await User.findById(req.user!.userId);
  if (!user) throw new AppError(404, "USER_NOT_FOUND", "User no longer exists");
  res.json({ user });
});

export default router;