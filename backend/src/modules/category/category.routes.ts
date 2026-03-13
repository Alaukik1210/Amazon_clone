import { Router } from "express";
import * as categoryController from "./category.controller";
import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";
import { validate } from "../../middlewares/validate";
import { createCategorySchema, updateCategorySchema } from "./category.validation";

const router = Router();

router.get("/", categoryController.listCategories);

router.post(
  "/",
  authenticate,
  authorize("ADMIN"),
  validate(createCategorySchema),
  categoryController.createCategory
);

router.put(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  validate(updateCategorySchema),
  categoryController.updateCategory
);

router.delete(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  categoryController.deleteCategory
);

export default router;
