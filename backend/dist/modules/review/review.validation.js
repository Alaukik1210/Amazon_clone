"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewQuerySchema = exports.createReviewSchema = void 0;
const zod_1 = require("zod");
exports.createReviewSchema = zod_1.z.object({
    rating: zod_1.z.number().int().min(1, "Rating must be at least 1").max(5, "Rating cannot exceed 5"),
    comment: zod_1.z.string().max(2000).optional(),
});
exports.reviewQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().positive().default(1),
    limit: zod_1.z.coerce.number().int().positive().max(50).default(10),
    sortBy: zod_1.z.enum(["newest", "oldest", "highest", "lowest"]).default("newest"),
});
