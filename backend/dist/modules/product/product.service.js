"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listProducts = listProducts;
exports.getProductBySlug = getProductBySlug;
exports.createProduct = createProduct;
exports.updateProduct = updateProduct;
exports.deleteProduct = deleteProduct;
const client_1 = require("@prisma/client");
const db_1 = __importDefault(require("../../config/db"));
const AppError_1 = require("../../utils/AppError");
const slug_1 = require("../../utils/slug");
const sku_1 = require("../../utils/sku");
// ── Helpers ───────────────────────────────────────────────────────────────────
async function buildUniqueSlug(title, excludeId) {
    const base = (0, slug_1.toSlug)(title);
    let slug = base;
    let i = 1;
    while (true) {
        const existing = await db_1.default.product.findUnique({ where: { slug } });
        if (!existing || existing.id === excludeId)
            return slug;
        slug = `${base}-${i++}`;
    }
}
// Fields included in every product list item and detail response
const productInclude = {
    images: { orderBy: { position: "asc" } },
    category: { select: { id: true, name: true, slug: true } },
};
// ── Service methods ───────────────────────────────────────────────────────────
async function listProducts(filters) {
    const { search, categoryId, minPrice, maxPrice, minRating, sortBy, page, limit } = filters;
    // Default to ACTIVE only unless explicitly requested otherwise (e.g. admin panel)
    const status = filters.status ?? client_1.ProductStatus.ACTIVE;
    if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
        throw new AppError_1.AppError("minPrice cannot be greater than maxPrice", 400);
    }
    const where = {
        status,
        ...(search && { title: { contains: search, mode: "insensitive" } }),
        ...(categoryId && { categoryId }),
        ...(minRating !== undefined && { avgRating: { gte: minRating } }),
        ...(minPrice !== undefined || maxPrice !== undefined
            ? {
                price: {
                    ...(minPrice !== undefined && { gte: new client_1.Prisma.Decimal(minPrice) }),
                    ...(maxPrice !== undefined && { lte: new client_1.Prisma.Decimal(maxPrice) }),
                },
            }
            : {}),
    };
    const orderBy = (() => {
        switch (sortBy) {
            case "price_asc": return { price: "asc" };
            case "price_desc": return { price: "desc" };
            case "oldest": return { createdAt: "asc" };
            case "rating": return { avgRating: "desc" };
            default: return { createdAt: "desc" }; // newest first
        }
    })();
    const skip = (page - 1) * limit;
    // Run count and fetch in parallel — no transaction needed for read-only queries
    const [products, total] = await Promise.all([
        db_1.default.product.findMany({ where, orderBy, skip, take: limit, include: productInclude }),
        db_1.default.product.count({ where }),
    ]);
    const totalPages = Math.ceil(total / limit);
    return {
        products,
        pagination: {
            total,
            page,
            limit,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
        },
    };
}
async function getProductBySlug(slug) {
    const product = await db_1.default.product.findUnique({
        where: { slug },
        include: {
            ...productInclude,
            _count: { select: { reviews: true } },
        },
    });
    if (!product)
        throw new AppError_1.AppError("Product not found", 404);
    // Hide non-active products from public (discontinued/out-of-stock handled by status field)
    if (product.status === client_1.ProductStatus.DISCONTINUED) {
        throw new AppError_1.AppError("Product not found", 404);
    }
    return product;
}
async function createProduct(data) {
    const category = await db_1.default.category.findUnique({ where: { id: data.categoryId } });
    if (!category)
        throw new AppError_1.AppError("Category not found", 404);
    const slug = await buildUniqueSlug(data.title);
    const sku = (0, sku_1.generateSku)(data.title);
    return db_1.default.product.create({
        data: {
            title: data.title,
            description: data.description,
            price: new client_1.Prisma.Decimal(data.price),
            mrp: new client_1.Prisma.Decimal(data.mrp),
            tags: data.tags ?? [],
            stock: data.stock,
            categoryId: data.categoryId,
            slug,
            sku,
            status: data.status ?? client_1.ProductStatus.ACTIVE,
            images: {
                create: data.images.map((url, position) => ({ url, position })),
            },
        },
        include: productInclude,
    });
}
async function updateProduct(id, data) {
    const product = await db_1.default.product.findUnique({ where: { id } });
    if (!product)
        throw new AppError_1.AppError("Product not found", 404);
    if (data.categoryId) {
        const category = await db_1.default.category.findUnique({ where: { id: data.categoryId } });
        if (!category)
            throw new AppError_1.AppError("Category not found", 404);
    }
    const slug = data.title ? await buildUniqueSlug(data.title, id) : undefined;
    // If images are provided, replace all — delete old, insert new (in a transaction)
    return db_1.default.$transaction(async (tx) => {
        if (data.images) {
            await tx.productImage.deleteMany({ where: { productId: id } });
        }
        return tx.product.update({
            where: { id },
            data: {
                ...(data.title && { title: data.title }),
                ...(data.description && { description: data.description }),
                ...(data.price !== undefined && { price: new client_1.Prisma.Decimal(data.price) }),
                ...(data.mrp !== undefined && { mrp: new client_1.Prisma.Decimal(data.mrp) }),
                ...(data.tags && { tags: data.tags }),
                ...(data.stock !== undefined && { stock: data.stock }),
                ...(data.categoryId && { categoryId: data.categoryId }),
                ...(data.status && { status: data.status }),
                ...(slug && { slug }),
                ...(data.images && {
                    images: {
                        create: data.images.map((url, position) => ({ url, position })),
                    },
                }),
            },
            include: productInclude,
        });
    });
}
async function deleteProduct(id) {
    const product = await db_1.default.product.findUnique({
        where: { id },
        include: { _count: { select: { orderItems: true } } },
    });
    if (!product)
        throw new AppError_1.AppError("Product not found", 404);
    // Hard delete is blocked by FK if orders reference this product.
    // Soft delete (DISCONTINUED) keeps order history intact.
    if (product._count.orderItems > 0) {
        return db_1.default.product.update({
            where: { id },
            data: { status: client_1.ProductStatus.DISCONTINUED },
        });
    }
    // Safe to hard delete — no orders reference this product
    await db_1.default.product.delete({ where: { id } });
}
