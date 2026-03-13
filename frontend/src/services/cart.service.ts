import api from "@/lib/api";
import type { ApiResponse, Cart } from "@/types";

export const cartService = {
  get: () => api.get<ApiResponse<Cart>>("/cart"),

  addItem: (data: { productId: string; quantity: number }) =>
    api.post<ApiResponse<Cart>>("/cart/items", data),

  updateItem: (itemId: string, quantity: number) =>
    api.patch<ApiResponse<Cart>>(`/cart/items/${itemId}`, { quantity }),

  removeItem: (itemId: string) =>
    api.delete<ApiResponse<Cart>>(`/cart/items/${itemId}`),

  clear: () => api.delete<ApiResponse<Cart>>("/cart"),
};
