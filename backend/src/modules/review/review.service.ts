import prisma from "../../config/db";
import { AppError } from "../../utils/AppError";
import type { ReviewQuery } from "./review.validation";

// ── Helpers ───────────────────────────────────────────────────────────────────

// Recalculates avgRating and reviewCount on Product after any review change.
// Called after create and delete — keeps denormalized fields accurate.
async function syncProductRating(productId: string) {
  const stats = await prisma.review.aggregate({
    where: { productId },
    _avg: { rating: true },
    _count: { rating: true },
  });

  await prisma.product.update({
    where: { id: productId },
    data: {
      avgRating: stats._avg.rating ?? 0,
      reviewCount: stats._count.rating,
    },
  });
}

// ── Service methods ───────────────────────────────────────────────────────────

export async function listReviews(productId: string, filters: ReviewQuery) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new AppError("Product not found", 404);

  const { page, limit, sortBy } = filters;

  const orderBy = (() => {
    switch (sortBy) {
      case "oldest":  return { createdAt: "asc" as const };
      case "highest": return { rating: "desc" as const };
      case "lowest":  return { rating: "asc" as const };
      default:        return { createdAt: "desc" as const }; // newest
    }
  })();

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where: { productId },
      include: { user: { select: { id: true, name: true } } },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.review.count({ where: { productId } }),
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

export async function createReview(
  userId: string,
  productId: string,
  data: { rating: number; comment?: string }
) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new AppError("Product not found", 404);

  // Must have a delivered order containing this product to leave a review
  const hasPurchased = await prisma.orderItem.findFirst({
    where: {
      productId,
      order: { userId, status: "DELIVERED" },
    },
  });

  if (!hasPurchased) {
    throw new AppError("You can only review products you have purchased and received", 403);
  }

  // @@unique([userId, productId]) in schema ensures one review per user per product
  const existing = await prisma.review.findUnique({
    where: { userId_productId: { userId, productId } },
  });
  if (existing) throw new AppError("You have already reviewed this product", 409);

  const review = await prisma.review.create({
    data: { userId, productId, rating: data.rating, comment: data.comment },
    include: { user: { select: { id: true, name: true } } },
  });

  // Update product's avgRating and reviewCount after new review
  await syncProductRating(productId);

  return review;
}

export async function deleteReview(reviewId: string, userId: string, isAdmin: boolean) {
  const review = await prisma.review.findUnique({ where: { id: reviewId } });

  if (!review) throw new AppError("Review not found", 404);

  // Only the review owner or an admin can delete
  if (!isAdmin && review.userId !== userId) {
    throw new AppError("Review not found", 404); // mask existence from other users
  }

  await prisma.review.delete({ where: { id: reviewId } });

  // Recalculate product rating after removal
  await syncProductRating(review.productId);
}
