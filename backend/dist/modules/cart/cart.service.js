"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCart = getCart;
exports.addItem = addItem;
exports.updateItem = updateItem;
exports.removeItem = removeItem;
exports.clearCart = clearCart;
const client_1 = require("@prisma/client");
const db_1 = __importDefault(require("../../config/db"));
const AppError_1 = require("../../utils/AppError");
// Fields included in every cart response
const cartInclude = {
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
                    images: { where: { position: 0 }, select: { url: true } },
                },
            },
        },
        orderBy: { createdAt: "asc" },
    },
};
// ── Helpers ───────────────────────────────────────────────────────────────────
// Attaches computed total to cart response so frontend doesn't recalculate
function withTotal(cart) {
    const total = cart.items.reduce((sum, item) => {
        return sum + Number(item.product.price) * item.quantity;
    }, 0);
    return { ...cart, total: Number(total.toFixed(2)) };
}
// ── Service methods ───────────────────────────────────────────────────────────
async function getCart(userId) {
    // Return empty cart shape if user hasn't added anything yet
    const cart = await db_1.default.cart.findUnique({
        where: { userId },
        include: cartInclude,
    });
    if (!cart)
        return { items: [], total: 0 };
    return withTotal(cart);
}
async function addItem(userId, data) {
    const product = await db_1.default.product.findUnique({ where: { id: data.productId } });
    if (!product)
        throw new AppError_1.AppError("Product not found", 404);
    if (product.status !== client_1.ProductStatus.ACTIVE)
        throw new AppError_1.AppError("Product is not available", 400);
    if (product.stock < data.quantity) {
        throw new AppError_1.AppError(`Only ${product.stock} unit(s) available in stock`, 400);
    }
    // Create cart if this is the user's first item (lazy cart creation)
    const cart = await db_1.default.cart.upsert({
        where: { userId },
        create: { userId },
        update: {},
    });
    // Check if product already in cart
    const existingItem = await db_1.default.cartItem.findUnique({
        where: { cartId_productId: { cartId: cart.id, productId: data.productId } },
    });
    if (existingItem) {
        const newQuantity = existingItem.quantity + data.quantity;
        // Validate combined quantity against stock
        if (newQuantity > product.stock) {
            throw new AppError_1.AppError(`Cannot add ${data.quantity} more — only ${product.stock - existingItem.quantity} unit(s) can be added (${product.stock} in stock, ${existingItem.quantity} already in cart)`, 400);
        }
        await db_1.default.cartItem.update({
            where: { id: existingItem.id },
            data: { quantity: newQuantity },
        });
    }
    else {
        try {
            await db_1.default.cartItem.create({
                data: { cartId: cart.id, productId: data.productId, quantity: data.quantity },
            });
        }
        catch (error) {
            // Race condition safety: if another request inserted same cart+product first, update instead of failing.
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
                const racedItem = await db_1.default.cartItem.findUnique({
                    where: { cartId_productId: { cartId: cart.id, productId: data.productId } },
                });
                if (!racedItem)
                    throw error;
                const newQuantity = racedItem.quantity + data.quantity;
                if (newQuantity > product.stock) {
                    throw new AppError_1.AppError(`Cannot add ${data.quantity} more — only ${product.stock - racedItem.quantity} unit(s) can be added (${product.stock} in stock, ${racedItem.quantity} already in cart)`, 400);
                }
                await db_1.default.cartItem.update({
                    where: { id: racedItem.id },
                    data: { quantity: newQuantity },
                });
            }
            else {
                throw error;
            }
        }
    }
    // Return updated full cart
    const updated = await db_1.default.cart.findUnique({ where: { userId }, include: cartInclude });
    return withTotal(updated);
}
async function updateItem(userId, itemId, quantity) {
    // Verify item belongs to this user's cart (prevents horizontal privilege escalation)
    const item = await db_1.default.cartItem.findFirst({
        where: { id: itemId, cart: { userId } },
        include: { product: true },
    });
    if (!item)
        throw new AppError_1.AppError("Cart item not found", 404);
    // quantity = 0 means user wants to remove the item
    if (quantity === 0) {
        await db_1.default.cartItem.delete({ where: { id: itemId } });
    }
    else {
        if (quantity > item.product.stock) {
            throw new AppError_1.AppError(`Only ${item.product.stock} unit(s) available in stock`, 400);
        }
        await db_1.default.cartItem.update({ where: { id: itemId }, data: { quantity } });
    }
    const cart = await db_1.default.cart.findUnique({ where: { userId }, include: cartInclude });
    return withTotal(cart);
}
async function removeItem(userId, itemId) {
    // Verify ownership before deleting
    const item = await db_1.default.cartItem.findFirst({
        where: { id: itemId, cart: { userId } },
    });
    if (!item)
        throw new AppError_1.AppError("Cart item not found", 404);
    await db_1.default.cartItem.delete({ where: { id: itemId } });
    const cart = await db_1.default.cart.findUnique({ where: { userId }, include: cartInclude });
    return withTotal(cart);
}
async function clearCart(userId) {
    const cart = await db_1.default.cart.findUnique({ where: { userId } });
    if (!cart)
        return; // nothing to clear
    await db_1.default.cartItem.deleteMany({ where: { cartId: cart.id } });
}
