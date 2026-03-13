import api from "@/lib/api";
import type { ApiResponse, Address } from "@/types";

export const addressService = {
  getAll: () => api.get<ApiResponse<Address[]>>("/addresses"),

  create: (data: Omit<Address, "id" | "userId" | "isDefault" | "createdAt" | "updatedAt">) =>
    api.post<ApiResponse<Address>>("/addresses", data),

  update: (id: string, data: Partial<Address>) =>
    api.put<ApiResponse<Address>>(`/addresses/${id}`, data),

  setDefault: (id: string) =>
    api.patch<ApiResponse<Address>>(`/addresses/${id}/default`),

  delete: (id: string) =>
    api.delete(`/addresses/${id}`),
};
