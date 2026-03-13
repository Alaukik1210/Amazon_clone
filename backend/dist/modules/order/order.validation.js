"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminOrderQuerySchema = exports.orderQuerySchema = exports.updateOrderStatusSchema = exports.placeOrderSchema = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
exports.placeOrderSchema = zod_1.z.object({
    addressId: zod_1.z.string().uuid("Invalid address ID"),
    paymentMode: zod_1.z.nativeEnum(client_1.PaymentMode).default(client_1.PaymentMode.COD),
});
exports.updateOrderStatusSchema = zod_1.z.object({
    status: zod_1.z.nativeEnum(client_1.OrderStatus),
});
exports.orderQuerySchema = zod_1.z.object({
    status: zod_1.z.nativeEnum(client_1.OrderStatus).optional(),
    page: zod_1.z.coerce.number().int().positive().default(1),
    limit: zod_1.z.coerce.number().int().positive().max(50).default(10),
});
// Admin can also filter by userId and date range
exports.adminOrderQuerySchema = exports.orderQuerySchema.extend({
    userId: zod_1.z.string().uuid().optional(),
    dateFrom: zod_1.z.coerce.date().optional(),
    dateTo: zod_1.z.coerce.date().optional(),
});
