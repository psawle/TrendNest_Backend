import { Router } from "express";
import { requireAdmin, requireAuth } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import * as ctrl from "./order.controller.js";
import { orderIdSchema, updateOrderStatusSchema } from "./order.schema.js";

const router = Router();

router.use(requireAuth);
router.post("/checkout", ctrl.checkout);
router.get("/my", ctrl.listMine);
router.get("/", requireAdmin, ctrl.listAll);
router.get("/:id", ctrl.getById);
router.patch("/:id/cancel", ctrl.cancel);
router.patch("/:id/status", requireAdmin, validate(updateOrderStatusSchema), ctrl.updateStatus);

router.param("id", (req, _res, next, id) => {
  orderIdSchema.parse(id);
  req.params.id = id;
  next();
});

export default router;
