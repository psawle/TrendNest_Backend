import { Router } from "express";
import * as ctrl from "./product.controller.js";
import { validate } from "../../middleware/validate.js";
import { validateQuery } from "../../middleware/validateQuery.js";
import { requireAuth, requireAdmin } from "../../middleware/auth.js";
import { objectIdSchema } from "../../utils/objectId.schema.js";
import reviewRoutes from "../reviews/review.routes.js";
import {
  createProductSchema,
  updateProductSchema,
  listProductsQuerySchema,
} from "./product.schema.js";

const router = Router();

router.get("/", validateQuery(listProductsQuerySchema), ctrl.list);
router.get("/:id", ctrl.getById);
router.post("/", requireAuth, requireAdmin, validate(createProductSchema), ctrl.create);
router.put("/:id", requireAuth, requireAdmin, validate(updateProductSchema), ctrl.update);
router.delete("/:id", requireAuth, requireAdmin, ctrl.remove);
router.use("/:id/reviews", reviewRoutes);

// Keep path identifiers validated before they reach Mongoose.
router.param("id", (req, _res, next, id) => {
  objectIdSchema.parse(id);
  req.params.id = id;
  next();
});

export default router;
