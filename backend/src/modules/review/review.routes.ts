import { Router } from "express";
import * as reviewController from "./review.controller";
import { authenticate } from "../../middlewares/authenticate";
import { validate, validateQuery } from "../../middlewares/validate";
import { createReviewSchema, reviewQuerySchema } from "./review.validation";

const router = Router({ mergeParams: true }); // to access :productId from parent router

// Public — list reviews for a product
router.get("/", validateQuery(reviewQuerySchema), reviewController.listReviews);

// Protected — post or delete a review
router.post("/", authenticate, validate(createReviewSchema), reviewController.createReview);
router.delete("/:reviewId", authenticate, reviewController.deleteReview);

export default router;
