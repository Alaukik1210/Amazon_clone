import { Router } from "express";
import * as orderController from "./order.controller";
import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";
import { validate, validateQuery } from "../../middlewares/validate";
import {
  placeOrderSchema,
  verifyPaymentSchema,
  updateOrderStatusSchema,
  orderQuerySchema,
  adminOrderQuerySchema,
} from "./order.validation";

const router = Router();

router.use(authenticate);

// Admin routes — must be defined BEFORE /:id to avoid "admin" being treated as an id
router.get("/admin/all", authorize("ADMIN"), validateQuery(adminOrderQuerySchema), orderController.getAllOrders);

// Customer routes
router.post("/", validate(placeOrderSchema), orderController.placeOrder);
router.get("/", validateQuery(orderQuerySchema), orderController.getMyOrders);
router.get("/:id/invoice", orderController.downloadOrderInvoice);
router.get("/:id", orderController.getOrderById);
router.patch("/:id/cancel", orderController.cancelOrder);
router.post("/:id/verify-payment", validate(verifyPaymentSchema), orderController.verifyPayment);

// Admin: update status
router.patch("/:id/status", authorize("ADMIN"), validate(updateOrderStatusSchema), orderController.updateOrderStatus);

export default router;
