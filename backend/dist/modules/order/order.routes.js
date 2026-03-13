"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const orderController = __importStar(require("./order.controller"));
const authenticate_1 = require("../../middlewares/authenticate");
const authorize_1 = require("../../middlewares/authorize");
const validate_1 = require("../../middlewares/validate");
const order_validation_1 = require("./order.validation");
const router = (0, express_1.Router)();
router.use(authenticate_1.authenticate);
// Admin routes — must be defined BEFORE /:id to avoid "admin" being treated as an id
router.get("/admin/all", (0, authorize_1.authorize)("ADMIN"), (0, validate_1.validateQuery)(order_validation_1.adminOrderQuerySchema), orderController.getAllOrders);
// Customer routes
router.post("/", (0, validate_1.validate)(order_validation_1.placeOrderSchema), orderController.placeOrder);
router.get("/", (0, validate_1.validateQuery)(order_validation_1.orderQuerySchema), orderController.getMyOrders);
router.get("/:id/invoice", orderController.downloadOrderInvoice);
router.get("/:id", orderController.getOrderById);
router.patch("/:id/cancel", orderController.cancelOrder);
// Admin: update status
router.patch("/:id/status", (0, authorize_1.authorize)("ADMIN"), (0, validate_1.validate)(order_validation_1.updateOrderStatusSchema), orderController.updateOrderStatus);
exports.default = router;
