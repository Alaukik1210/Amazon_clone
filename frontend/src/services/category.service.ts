import api from "@/lib/api";
import type { ApiResponse, Category } from "@/types";

export const categoryService = {
  getAll: () => api.get<ApiResponse<Category[]>>("/categories"),

  create: (data: { name: string; description?: string }) =>
    api.post<ApiResponse<Category>>("/categories", data),

  update: (id: string, data: { name?: string; description?: string }) =>
    api.put<ApiResponse<Category>>(`/categories/${id}`, data),

  delete: (id: string) =>
    api.delete(`/categories/${id}`),
};
