"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = __importDefault(require("../config/db"));
const auth_routes_1 = __importDefault(require("../modules/auth/auth.routes"));
const category_routes_1 = __importDefault(require("../modules/category/category.routes"));
const product_routes_1 = __importDefault(require("../modules/product/product.routes"));
const cart_routes_1 = __importDefault(require("../modules/cart/cart.routes"));
const address_routes_1 = __importDefault(require("../modules/address/address.routes"));
const order_routes_1 = __importDefault(require("../modules/order/order.routes"));
const review_routes_1 = __importDefault(require("../modules/review/review.routes"));
const wishlist_routes_1 = __importDefault(require("../modules/wishlist/wishlist.routes"));
const router = (0, express_1.Router)();
// Health checks
router.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok", uptime: process.uptime(), timestamp: new Date().toISOString() });
});
router.get("/ready", async (_req, res) => {
    await db_1.default.$queryRaw `SELECT 1`;
    res.status(200).json({ status: "ok", database: "connected" });
});
// Feature routes
router.use("/auth", auth_routes_1.default);
router.use("/categories", category_routes_1.default);
router.use("/products", product_routes_1.default);
router.use("/products/:productId/reviews", review_routes_1.default); // nested: /products/:id/reviews
router.use("/cart", cart_routes_1.default);
router.use("/addresses", address_routes_1.default);
router.use("/orders", order_routes_1.default);
router.use("/wishlist", wishlist_routes_1.default);
exports.default = router;
