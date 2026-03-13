import { Router } from "express";
import * as wishlistController from "./wishlist.controller";
import { authenticate } from "../../middlewares/authenticate";
import { validate } from "../../middlewares/validate";
import { addWishlistItemSchema } from "./wishlist.validation";

const router = Router();

router.use(authenticate);

router.get("/", wishlistController.getWishlist);
router.post("/items", validate(addWishlistItemSchema), wishlistController.addItem);
router.delete("/items/:itemId", wishlistController.removeItem);
// Move to cart removes from wishlist and adds to cart atomically
router.post("/items/:itemId/move-to-cart", wishlistController.moveToCart);

export default router;
