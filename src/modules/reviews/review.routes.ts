import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import * as ctrl from "./review.controller.js";
import { createReviewSchema } from "./review.schema.js";

// Mounted at /products/:id/reviews — mergeParams makes the parent's :id visible here.
const router = Router({ mergeParams: true });

router.get("/", ctrl.list);
router.post("/", requireAuth, validate(createReviewSchema), ctrl.create);

export default router;
