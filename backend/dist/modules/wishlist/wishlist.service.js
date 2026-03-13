"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWishlist = getWishlist;
exports.addItem = addItem;
exports.removeItem = removeItem;
exports.moveToCart = moveToCart;
const client_1 = require("@prisma/client");
const db_1 = __importDefault(require("../../config/db"));
const AppError_1 = require("../../utils/AppError");
// Consistent wishlist include — only thumbnail image
const wishlistInclude = {
    items: {
        include: {
            product: {
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    price: true,
                    stock: true,
                    status: true,
                    avgRating: true,
                    images: { where: { position: 0 }, select: { url: true } },
                },
            },
        },
        orderBy: { createdAt: "desc" },
    },
};
async function getWishlist(userId) {
    const wishlist = await db_1.default.wishlist.findUnique({
        where: { userId },
        include: wishlistInclude,
    });
    // Return empty shape if no wishlist exists yet
    if (!wishlist)
        return { items: [] };
    return wishlist;
}
async function addItem(userId, productId) {
    const product = await db_1.default.product.findUnique({ where: { id: productId } });
    if (!product)
        throw new AppError_1.AppError("Product not found", 404);
    // Discontinued products shouldn't be wish-listable
    if (product.status === client_1.ProductStatus.DISCONTINUED) {
        throw new AppError_1.AppError("Product is not available", 400);
    }
    // Create wishlist lazily on first add
    const wishlist = await db_1.default.wishlist.upsert({
        where: { userId },
        create: { userId },
        update: {},
    });
    // @@unique([wishlistId, productId]) prevents duplicates at DB level
    // but we return a friendly error instead of a constraint crash
    const existing = await db_1.default.wishlistItem.findUnique({
        where: { wishlistId_productId: { wishlistId: wishlist.id, productId } },
    });
    if (existing)
        throw new AppError_1.AppError("Product is already in your wishlist", 409);
    await db_1.default.wishlistItem.create({
        data: { wishlistId: wishlist.id, productId },
    });
    return db_1.default.wishlist.findUnique({ where: { userId }, include: wishlistInclude });
}
async function removeItem(userId, itemId) {
    // Verify ownership
    const item = await db_1.default.wishlistItem.findFirst({
        where: { id: itemId, wishlist: { userId } },
    });
    if (!item)
        throw new AppError_1.AppError("Wishlist item not found", 404);
    await db_1.default.wishlistItem.delete({ where: { id: itemId } });
    return db_1.default.wishlist.findUnique({ where: { userId }, include: wishlistInclude });
}
async function moveToCart(userId, itemId) {
    // Verify ownership
    const item = await db_1.default.wishlistItem.findFirst({
        where: { id: itemId, wishlist: { userId } },
        include: { product: true },
    });
    if (!item)
        throw new AppError_1.AppError("Wishlist item not found", 404);
    const product = item.product;
    if (product.status !== client_1.ProductStatus.ACTIVE) {
        throw new AppError_1.AppError("Product is not available to add to cart", 400);
    }
    if (product.stock < 1) {
        throw new AppError_1.AppError("Product is out of stock", 400);
    }
    // Add to cart (create cart lazily if needed)
    const cart = await db_1.default.cart.upsert({
        where: { userId },
        create: { userId },
        update: {},
    });
    const existingCartItem = await db_1.default.cartItem.findUnique({
        where: { cartId_productId: { cartId: cart.id, productId: product.id } },
    });
    if (existingCartItem) {
        const newQty = existingCartItem.quantity + 1;
        if (newQty > product.stock) {
            throw new AppError_1.AppError(`Only ${product.stock} unit(s) in stock and you already have ${existingCartItem.quantity} in cart`, 400);
        }
        await db_1.default.cartItem.update({ where: { id: existingCartItem.id }, data: { quantity: newQty } });
    }
    else {
        await db_1.default.cartItem.create({ data: { cartId: cart.id, productId: product.id, quantity: 1 } });
    }
    // Remove from wishlist after successful cart add
    await db_1.default.wishlistItem.delete({ where: { id: itemId } });
    return db_1.default.wishlist.findUnique({ where: { userId }, include: wishlistInclude });
}
