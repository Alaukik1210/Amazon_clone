import api from "@/lib/api";
import type { AxiosResponse } from "axios";
import type { ApiResponse, Order, OrderListResponse, OrderFilters, PaymentMode } from "@/types";

export const orderService = {
  place: (data: { addressId: string; paymentMode: PaymentMode }) =>
    api.post<ApiResponse<{ order: Order }>>("/orders", data),

  getAll: (params?: OrderFilters) =>
    api.get<ApiResponse<OrderListResponse>>("/orders", { params }),

  getById: (id: string) =>
    api.get<ApiResponse<Order>>(`/orders/${id}`),

  downloadInvoice: (id: string): Promise<AxiosResponse<Blob>> =>
    api.get(`/orders/${id}/invoice`, {
      responseType: "blob",
      headers: { Accept: "application/pdf" },
    }),

  cancel: (id: string) =>
    api.patch<ApiResponse<Order>>(`/orders/${id}/cancel`),
};
