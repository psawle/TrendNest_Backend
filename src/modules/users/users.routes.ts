// src/modules/users/users.routes.ts
import { Router } from "express";
import { requireAuth, requireAdmin } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { objectIdSchema } from "../../utils/objectId.schema.js";
import { updateUserSchema } from "./user.schema.js";
import * as ctrl from "./user.controller.js";

const router = Router();

router.get("/me", requireAuth, ctrl.me);
router.get("/:id", requireAuth, requireAdmin, ctrl.getById);
router.put("/:id", requireAuth, requireAdmin, validate(updateUserSchema), ctrl.update);

// Keep path identifiers validated before they reach Mongoose.
router.param("id", (req, _res, next, id) => {
  objectIdSchema.parse(id);
  req.params.id = id;
  next();
});

export default router;
