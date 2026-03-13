import { Router } from "express";
import * as cartController from "./cart.controller";
import { authenticate } from "../../middlewares/authenticate";
import { validate } from "../../middlewares/validate";
import { addItemSchema, updateItemSchema } from "./cart.validation";

const router = Router();

// All cart routes require authentication
router.use(authenticate);

router.get("/", cartController.getCart);
router.post("/items", validate(addItemSchema), cartController.addItem);
router.patch("/items/:itemId", validate(updateItemSchema), cartController.updateItem);
router.delete("/items/:itemId", cartController.removeItem);
router.delete("/", cartController.clearCart);

export default router;
