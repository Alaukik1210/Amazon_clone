"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addWishlistItemSchema = void 0;
const zod_1 = require("zod");
exports.addWishlistItemSchema = zod_1.z.object({
    productId: zod_1.z.string().uuid("Invalid product ID"),
});
