import api from "@/lib/api";
import type { ApiResponse, Review, ReviewListResponse, ReviewFilters } from "@/types";

export const reviewService = {
  getAll: (productId: string, params?: ReviewFilters) =>
    api.get<ApiResponse<ReviewListResponse>>(`/products/${productId}/reviews`, { params }),

  create: (productId: string, data: { rating: number; comment?: string }) =>
    api.post<ApiResponse<Review>>(`/products/${productId}/reviews`, data),

  delete: (productId: string, reviewId: string) =>
    api.delete(`/products/${productId}/reviews/${reviewId}`),
};
