import { z } from "zod";
import { OrderStatus, PaymentMode } from "@prisma/client";

export const placeOrderSchema = z.object({
  addressId: z.string().uuid("Invalid address ID"),
  paymentMode: z.nativeEnum(PaymentMode).default(PaymentMode.COD),
});

export const verifyPaymentSchema = z.object({
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
});

export const updateOrderStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
});

export const orderQuerySchema = z.object({
  status: z.nativeEnum(OrderStatus).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10),
});

// Admin can also filter by userId and date range
export const adminOrderQuerySchema = orderQuerySchema.extend({
  userId: z.string().uuid().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});

export type OrderQuery = z.infer<typeof orderQuerySchema>;
export type AdminOrderQuery = z.infer<typeof adminOrderQuerySchema>;
