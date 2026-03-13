"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listCategories = listCategories;
exports.createCategory = createCategory;
exports.updateCategory = updateCategory;
exports.deleteCategory = deleteCategory;
const db_1 = __importDefault(require("../../config/db"));
const AppError_1 = require("../../utils/AppError");
const slug_1 = require("../../utils/slug");
// ── Helpers ──────────────────────────────────────────────────────────────────
// Ensures slug is unique among categories; appends counter if taken
async function buildUniqueSlug(name, excludeId) {
    const base = (0, slug_1.toSlug)(name);
    let slug = base;
    let i = 1;
    while (true) {
        const existing = await db_1.default.category.findUnique({ where: { slug } });
        if (!existing || existing.id === excludeId)
            return slug;
        slug = `${base}-${i++}`;
    }
}
// ── Service methods ───────────────────────────────────────────────────────────
async function listCategories() {
    return db_1.default.category.findMany({
        orderBy: { name: "asc" },
        include: { _count: { select: { products: true } } },
    });
}
async function createCategory(data) {
    const existing = await db_1.default.category.findUnique({ where: { name: data.name } });
    if (existing)
        throw new AppError_1.AppError("Category with this name already exists", 409);
    const slug = await buildUniqueSlug(data.name);
    return db_1.default.category.create({ data: { name: data.name, slug, description: data.description } });
}
async function updateCategory(id, data) {
    const category = await db_1.default.category.findUnique({ where: { id } });
    if (!category)
        throw new AppError_1.AppError("Category not found", 404);
    // If name is changing, check uniqueness and regenerate slug
    if (data.name && data.name !== category.name) {
        const nameConflict = await db_1.default.category.findUnique({ where: { name: data.name } });
        if (nameConflict)
            throw new AppError_1.AppError("Category with this name already exists", 409);
    }
    const slug = data.name ? await buildUniqueSlug(data.name, id) : undefined;
    return db_1.default.category.update({
        where: { id },
        data: { ...data, ...(slug && { slug }) },
    });
}
async function deleteCategory(id) {
    const category = await db_1.default.category.findUnique({
        where: { id },
        include: { _count: { select: { products: true } } },
    });
    if (!category)
        throw new AppError_1.AppError("Category not found", 404);
    // Prevent delete if products are assigned — would break FK constraint
    if (category._count.products > 0) {
        throw new AppError_1.AppError(`Cannot delete — ${category._count.products} product(s) are assigned to this category. Reassign or delete them first.`, 409);
    }
    await db_1.default.category.delete({ where: { id } });
}
