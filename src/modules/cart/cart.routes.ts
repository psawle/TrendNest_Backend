import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import * as ctrl from "./cart.controller.js";
import { addCartItemSchema, objectIdSchema, updateCartItemSchema } from "./cart.schema.js";

const router = Router();

router.use(requireAuth);
router.get("/", ctrl.get);
router.post("/", validate(addCartItemSchema), ctrl.add);
router.patch("/:productId", validate(updateCartItemSchema), ctrl.update);
router.delete("/:productId", ctrl.remove);
router.delete("/", ctrl.clear);

// Keep path identifiers validated before they reach Mongoose.
router.param("productId", (req, _res, next, productId) => {
  objectIdSchema.parse(productId);
  req.params.productId = productId;
  next();
});

export default router;
