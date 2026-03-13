import api from "@/lib/api";
import type { ApiResponse, Wishlist } from "@/types";

export const wishlistService = {
  get: () => api.get<ApiResponse<Wishlist>>("/wishlist"),

  addItem: (productId: string) =>
    api.post<ApiResponse<Wishlist>>("/wishlist/items", { productId }),

  removeItem: (itemId: string) =>
    api.delete<ApiResponse<Wishlist>>(`/wishlist/items/${itemId}`),

  moveToCart: (itemId: string) =>
    api.post<ApiResponse<Wishlist>>(`/wishlist/items/${itemId}/move-to-cart`),
};
