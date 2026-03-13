"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productQuerySchema = exports.updateProductSchema = exports.createProductSchema = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
exports.createProductSchema = zod_1.z.object({
    title: zod_1.z.string().min(3).max(500),
    description: zod_1.z.string().min(10),
    price: zod_1.z.number().positive("Price must be positive"),
    mrp: zod_1.z.number().positive("MRP must be positive"),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
    stock: zod_1.z.number().int().min(0).default(0),
    categoryId: zod_1.z.string().uuid("Invalid category ID"),
    images: zod_1.z.array(zod_1.z.string().url("Each image must be a valid URL")).min(1, "At least one image is required"),
    status: zod_1.z.nativeEnum(client_1.ProductStatus).optional(),
});
exports.updateProductSchema = exports.createProductSchema.partial();
exports.productQuerySchema = zod_1.z.object({
    search: zod_1.z.string().optional(),
    categoryId: zod_1.z.string().uuid().optional(),
    minPrice: zod_1.z.coerce.number().positive().optional(),
    maxPrice: zod_1.z.coerce.number().positive().optional(),
    minRating: zod_1.z.coerce.number().min(0).max(5).optional(),
    status: zod_1.z.nativeEnum(client_1.ProductStatus).optional(),
    sortBy: zod_1.z
        .enum(["price_asc", "price_desc", "newest", "oldest", "rating"])
        .optional(),
    page: zod_1.z.coerce.number().int().positive().default(1),
    limit: zod_1.z.coerce.number().int().positive().max(100).default(20),
});
