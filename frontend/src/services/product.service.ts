import api from "@/lib/api";
import type { ApiResponse, Product, ProductFilters, ProductListResponse } from "@/types";

// Input type for creating a product — images are URL strings (not objects)
export interface CreateProductInput {
  title: string;
  description: string;
  price: number;
  stock: number;
  categoryId: string;
  images: string[]; // array of URLs — backend stores them as ProductImage objects
  status?: string;
}

export const productService = {
  getAll: (filters?: ProductFilters) =>
    api.get<ApiResponse<ProductListResponse>>("/products", { params: filters }),

  getBySlug: (slug: string) =>
    api.get<ApiResponse<Product>>(`/products/${slug}`),

  create: (data: CreateProductInput) =>
    api.post<ApiResponse<Product>>("/products", data),

  update: (id: string, data: Partial<CreateProductInput>) =>
    api.put<ApiResponse<Product>>(`/products/${id}`, data),

  delete: (id: string) =>
    api.delete(`/products/${id}`),
};
