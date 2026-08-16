import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { objectIdSchema } from "../../utils/objectId.schema.js";
import * as ctrl from "./wishlist.controller.js";
import { addWishlistItemSchema } from "./wishlist.schema.js";

const router = Router();

router.use(requireAuth);
router.get("/", ctrl.get);
router.post("/items", validate(addWishlistItemSchema), ctrl.add);
router.delete("/items/:productId", ctrl.remove);

// Keep path identifiers validated before they reach Mongoose.
router.param("productId", (req, _res, next, productId) => {
  objectIdSchema.parse(productId);
  req.params.productId = productId;
  next();
});

export default router;
