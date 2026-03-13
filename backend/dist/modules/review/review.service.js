"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listReviews = listReviews;
exports.createReview = createReview;
exports.deleteReview = deleteReview;
const db_1 = __importDefault(require("../../config/db"));
const AppError_1 = require("../../utils/AppError");
// ── Helpers ───────────────────────────────────────────────────────────────────
// Recalculates avgRating and reviewCount on Product after any review change.
// Called after create and delete — keeps denormalized fields accurate.
async function syncProductRating(productId) {
    const stats = await db_1.default.review.aggregate({
        where: { productId },
        _avg: { rating: true },
        _count: { rating: true },
    });
    await db_1.default.product.update({
        where: { id: productId },
        data: {
            avgRating: stats._avg.rating ?? 0,
            reviewCount: stats._count.rating,
        },
    });
}
// ── Service methods ───────────────────────────────────────────────────────────
async function listReviews(productId, filters) {
    const product = await db_1.default.product.findUnique({ where: { id: productId } });
    if (!product)
        throw new AppError_1.AppError("Product not found", 404);
    const { page, limit, sortBy } = filters;
    const orderBy = (() => {
        switch (sortBy) {
            case "oldest": return { createdAt: "asc" };
            case "highest": return { rating: "desc" };
            case "lowest": return { rating: "asc" };
            default: return { createdAt: "desc" }; // newest
        }
    })();
    const [reviews, total] = await Promise.all([
        db_1.default.review.findMany({
            where: { productId },
            include: { user: { select: { id: true, name: true } } },
            orderBy,
            skip: (page - 1) * limit,
            take: limit,
        }),
        db_1.default.review.count({ where: { productId } }),
    ]);
    return {
        reviews,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            hasNext: page < Math.ceil(total / limit),
            hasPrev: page > 1,
        },
    };
}
async function createReview(userId, productId, data) {
    const product = await db_1.default.product.findUnique({ where: { id: productId } });
    if (!product)
        throw new AppError_1.AppError("Product not found", 404);
    // Must have a delivered order containing this product to leave a review
    const hasPurchased = await db_1.default.orderItem.findFirst({
        where: {
            productId,
            order: { userId, status: "DELIVERED" },
        },
    });
    if (!hasPurchased) {
        throw new AppError_1.AppError("You can only review products you have purchased and received", 403);
    }
    // @@unique([userId, productId]) in schema ensures one review per user per product
    const existing = await db_1.default.review.findUnique({
        where: { userId_productId: { userId, productId } },
    });
    if (existing)
        throw new AppError_1.AppError("You have already reviewed this product", 409);
    const review = await db_1.default.review.create({
        data: { userId, productId, rating: data.rating, comment: data.comment },
        include: { user: { select: { id: true, name: true } } },
    });
    // Update product's avgRating and reviewCount after new review
    await syncProductRating(productId);
    return review;
}
async function deleteReview(reviewId, userId, isAdmin) {
    const review = await db_1.default.review.findUnique({ where: { id: reviewId } });
    if (!review)
        throw new AppError_1.AppError("Review not found", 404);
    // Only the review owner or an admin can delete
    if (!isAdmin && review.userId !== userId) {
        throw new AppError_1.AppError("Review not found", 404); // mask existence from other users
    }
    await db_1.default.review.delete({ where: { id: reviewId } });
    // Recalculate product rating after removal
    await syncProductRating(review.productId);
}
