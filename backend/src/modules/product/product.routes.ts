import { Router } from "express";
import * as productController from "./product.controller";
import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";
import { validate, validateQuery } from "../../middlewares/validate";
import {
  createProductSchema,
  updateProductSchema,
  productQuerySchema,
} from "./product.validation";

const router = Router();

// Public
router.get("/", validateQuery(productQuerySchema), productController.listProducts);
router.get("/:slug", productController.getProductBySlug);

// Admin only
router.post(
  "/",
  authenticate,
  authorize("ADMIN"),
  validate(createProductSchema),
  productController.createProduct
);

router.put(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  validate(updateProductSchema),
  productController.updateProduct
);

router.delete(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  productController.deleteProduct
);

export default router;
