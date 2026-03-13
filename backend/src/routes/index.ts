import { Router } from "express";
import prisma from "../config/db";
import authRoutes from "../modules/auth/auth.routes";
import categoryRoutes from "../modules/category/category.routes";
import productRoutes from "../modules/product/product.routes";
import cartRoutes from "../modules/cart/cart.routes";
import addressRoutes from "../modules/address/address.routes";
import orderRoutes from "../modules/order/order.routes";
import reviewRoutes from "../modules/review/review.routes";
import wishlistRoutes from "../modules/wishlist/wishlist.routes";

const router = Router();

// Health checks
router.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", uptime: process.uptime(), timestamp: new Date().toISOString() });
});
router.get("/ready", async (_req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  res.status(200).json({ status: "ok", database: "connected" });
});

// Feature routes
router.use("/auth", authRoutes);
router.use("/categories", categoryRoutes);
router.use("/products", productRoutes);
router.use("/products/:productId/reviews", reviewRoutes); // nested: /products/:id/reviews
router.use("/cart", cartRoutes);
router.use("/addresses", addressRoutes);
router.use("/orders", orderRoutes);
router.use("/wishlist", wishlistRoutes);

export default router;
