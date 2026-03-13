"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateItemSchema = exports.addItemSchema = void 0;
const zod_1 = require("zod");
exports.addItemSchema = zod_1.z.object({
    productId: zod_1.z.string().uuid("Invalid product ID"),
    quantity: zod_1.z.number().int().positive("Quantity must be at least 1").default(1),
});
exports.updateItemSchema = zod_1.z.object({
    // quantity 0 means remove the item — handled in service
    quantity: zod_1.z.number().int().min(0, "Quantity cannot be negative"),
});
