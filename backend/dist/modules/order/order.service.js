"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.placeOrder = placeOrder;
exports.getMyOrders = getMyOrders;
exports.getOrderById = getOrderById;
exports.generateOrderInvoice = generateOrderInvoice;
exports.cancelOrder = cancelOrder;
exports.updateOrderStatus = updateOrderStatus;
exports.getAllOrders = getAllOrders;
const client_1 = require("@prisma/client");
const db_1 = __importDefault(require("../../config/db"));
const AppError_1 = require("../../utils/AppError");
const email_1 = require("../../utils/email");
const emailTemplates_1 = require("../../utils/emailTemplates");
const order_invoice_1 = require("./order.invoice");
// ── Shared include shape ──────────────────────────────────────────────────────
const orderInclude = {
    shippingAddress: true,
    items: {
        include: {
            product: {
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    images: { where: { position: 0 }, select: { url: true } },
                },
            },
        },
    },
};
// ── Shared helpers ────────────────────────────────────────────────────────────
/** Validate cart: ensure not empty, all products ACTIVE and in stock. */
async function validateCart(userId) {
    const cart = await db_1.default.cart.findUnique({
        where: { userId },
        include: { items: { include: { product: true } } },
    });
    if (!cart || cart.items.length === 0)
        throw new AppError_1.AppError("Your cart is empty", 400);
    const errors = [];
    for (const item of cart.items) {
        if (item.product.status !== client_1.ProductStatus.ACTIVE) {
            errors.push(`"${item.product.title}" is no longer available`);
        }
        else if (item.product.stock < item.quantity) {
            errors.push(`"${item.product.title}" only has ${item.product.stock} unit(s) in stock (you requested ${item.quantity})`);
        }
    }
    if (errors.length > 0)
        throw new AppError_1.AppError(errors.join(", "), 400);
    return cart;
}
/** Deduct stock for each item, clear the cart — runs inside a transaction. */
async function finalizeOrder(tx, orderId, cartId, items, options) {
    for (const item of items) {
        // Atomic decrement prevents race conditions where concurrent checkouts oversell stock.
        const updated = await tx.product.updateMany({
            where: {
                id: item.productId,
                status: client_1.ProductStatus.ACTIVE,
                stock: { gte: item.quantity },
            },
            data: {
                stock: { decrement: item.quantity },
            },
        });
        if (updated.count !== 1) {
            throw new AppError_1.AppError(`\"${item.product.title}\" is no longer available in the requested quantity`, 409);
        }
    }
    await tx.product.updateMany({
        where: {
            id: { in: items.map((item) => item.productId) },
            stock: { lte: 0 },
        },
        data: { status: client_1.ProductStatus.OUT_OF_STOCK },
    });
    await tx.cartItem.deleteMany({ where: { cartId } });
    return tx.order.update({
        where: { id: orderId },
        data: {
            ...(options.markAsPaid ? { paymentStatus: client_1.PaymentStatus.PAID } : {}),
        },
        include: orderInclude,
    });
}
/** Fire-and-forget confirmation email — never blocks order response. */
async function sendConfirmationEmail(userId, order) {
    const user = await db_1.default.user.findUnique({ where: { id: userId }, select: { name: true, email: true } });
    if (!user)
        return;
    const html = (0, emailTemplates_1.buildOrderConfirmationEmail)({
        userName: user.name ?? "Customer",
        orderId: order.id,
        createdAt: order.createdAt,
        items: order.items,
        totalAmount: order.totalAmount,
        shippingAddress: order.shippingAddress,
    });
    (0, email_1.sendEmail)(user.email, "Your order has been placed! 🛒", html).catch((err) => {
        console.error("[Order Email] Failed to send confirmation:", err?.message);
    });
}
// ── Place Order ───────────────────────────────────────────────────────────────
async function placeOrder(userId, addressId, paymentMode) {
    // 1. Verify address belongs to user
    const address = await db_1.default.address.findUnique({ where: { id: addressId } });
    if (!address || address.userId !== userId)
        throw new AppError_1.AppError("Address not found", 404);
    // 2. Validate cart (throws on empty / unavailable / insufficient stock)
    const cart = await validateCart(userId);
    // 3. Calculate total
    const totalAmount = cart.items.reduce((sum, item) => sum.plus(new client_1.Prisma.Decimal(item.product.price).mul(item.quantity)), new client_1.Prisma.Decimal(0));
    if (paymentMode === client_1.PaymentMode.RAZORPAY) {
        throw new AppError_1.AppError("Online payment is temporarily unavailable. Please use Cash on Delivery.", 400);
    }
    // ── COD / TEST_BYPASS: place order + deduct stock immediately ──────────────
    if (paymentMode === client_1.PaymentMode.COD || paymentMode === client_1.PaymentMode.TEST_BYPASS) {
        const order = await db_1.default.$transaction(async (tx) => {
            const newOrder = await tx.order.create({
                data: {
                    userId,
                    addressId,
                    totalAmount,
                    paymentMode,
                    status: client_1.OrderStatus.PENDING,
                    paymentStatus: paymentMode === client_1.PaymentMode.COD ? client_1.PaymentStatus.PENDING : client_1.PaymentStatus.PAID,
                    items: {
                        create: cart.items.map((item) => ({
                            productId: item.productId,
                            quantity: item.quantity,
                            price: item.product.price,
                        })),
                    },
                },
                include: orderInclude,
            });
            return finalizeOrder(tx, newOrder.id, cart.id, cart.items, {
                markAsPaid: paymentMode === client_1.PaymentMode.TEST_BYPASS,
            });
        });
        sendConfirmationEmail(userId, order);
        return { order };
    }
}
// ── My Orders ─────────────────────────────────────────────────────────────────
async function getMyOrders(userId, filters) {
    const { status, page, limit } = filters;
    const where = {
        userId,
        ...(status && { status }),
    };
    const [orders, total] = await Promise.all([
        db_1.default.order.findMany({
            where,
            include: orderInclude,
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * limit,
            take: limit,
        }),
        db_1.default.order.count({ where }),
    ]);
    return {
        orders,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            hasNext: page < Math.ceil(total / limit),
            hasPrev: page > 1,
        },
    };
}
// ── Single Order ──────────────────────────────────────────────────────────────
async function getOrderById(orderId, userId, isAdmin) {
    const order = await db_1.default.order.findUnique({
        where: { id: orderId },
        include: {
            ...orderInclude,
            user: { select: { id: true, name: true, email: true } },
        },
    });
    if (!order)
        throw new AppError_1.AppError("Order not found", 404);
    // Customers can only view their own orders
    if (!isAdmin && order.userId !== userId) {
        throw new AppError_1.AppError("Order not found", 404); // same msg — don't leak existence
    }
    return order;
}
async function generateOrderInvoice(orderId, userId, isAdmin) {
    const order = await getOrderById(orderId, userId, isAdmin);
    const pdfBuffer = await (0, order_invoice_1.buildOrderInvoicePdf)({
        id: order.id,
        createdAt: order.createdAt,
        paymentMode: order.paymentMode,
        paymentStatus: order.paymentStatus,
        razorpayPaymentId: order.razorpayPaymentId,
        totalAmount: order.totalAmount.toString(),
        user: {
            name: order.user?.name ?? null,
            email: order.user?.email ?? "",
        },
        shippingAddress: {
            street: order.shippingAddress.street,
            city: order.shippingAddress.city,
            state: order.shippingAddress.state,
            postalCode: order.shippingAddress.postalCode,
            country: order.shippingAddress.country,
        },
        items: order.items.map((item) => ({
            title: item.product.title,
            quantity: item.quantity,
            unitPrice: item.price.toString(),
        })),
    });
    return {
        buffer: pdfBuffer,
        fileName: `invoice-${order.id.slice(-10).toUpperCase()}.pdf`,
    };
}
// ── Cancel Order (Customer) ───────────────────────────────────────────────────
async function cancelOrder(orderId, userId) {
    const order = await db_1.default.order.findUnique({ where: { id: orderId } });
    if (!order)
        throw new AppError_1.AppError("Order not found", 404);
    if (order.userId !== userId)
        throw new AppError_1.AppError("Order not found", 404);
    // Customers can only cancel PENDING orders
    if (order.status !== client_1.OrderStatus.PENDING) {
        throw new AppError_1.AppError(`Order cannot be cancelled — current status is ${order.status}. Only PENDING orders can be cancelled.`, 400);
    }
    // Restore stock for each item on cancellation
    return db_1.default.$transaction(async (tx) => {
        const items = await tx.orderItem.findMany({
            where: { orderId },
            include: { product: true },
        });
        for (const item of items) {
            const newStock = item.product.stock + item.quantity;
            await tx.product.update({
                where: { id: item.productId },
                data: {
                    stock: newStock,
                    // Re-activate if it was auto-marked OUT_OF_STOCK when last unit was sold
                    ...(item.product.status === client_1.ProductStatus.OUT_OF_STOCK && {
                        status: client_1.ProductStatus.ACTIVE,
                    }),
                },
            });
        }
        return tx.order.update({
            where: { id: orderId },
            data: {
                status: client_1.OrderStatus.CANCELLED,
                // Razorpay paid orders need manual refund (out of scope here)
                ...(order.paymentStatus === client_1.PaymentStatus.PAID && { paymentStatus: client_1.PaymentStatus.REFUNDED }),
            },
            include: orderInclude,
        });
    });
}
// ── Update Status (Admin) ─────────────────────────────────────────────────────
async function updateOrderStatus(orderId, status) {
    const order = await db_1.default.order.findUnique({ where: { id: orderId } });
    if (!order)
        throw new AppError_1.AppError("Order not found", 404);
    // Enforce logical status progression — can't go backwards
    const flow = [
        client_1.OrderStatus.PENDING,
        client_1.OrderStatus.PROCESSING,
        client_1.OrderStatus.SHIPPED,
        client_1.OrderStatus.DELIVERED,
    ];
    const currentIdx = flow.indexOf(order.status);
    const newIdx = flow.indexOf(status);
    // Allow CANCELLED from any non-delivered status
    if (status === client_1.OrderStatus.CANCELLED) {
        if (order.status === client_1.OrderStatus.DELIVERED) {
            throw new AppError_1.AppError("Delivered orders cannot be cancelled", 400);
        }
    }
    else if (newIdx !== -1 && currentIdx !== -1 && newIdx < currentIdx) {
        throw new AppError_1.AppError(`Cannot move order from ${order.status} back to ${status}`, 400);
    }
    return db_1.default.order.update({
        where: { id: orderId },
        data: { status },
        include: orderInclude,
    });
}
// ── Admin: All Orders ─────────────────────────────────────────────────────────
async function getAllOrders(filters) {
    const { status, userId, dateFrom, dateTo, page, limit } = filters;
    const where = {
        ...(status && { status }),
        ...(userId && { userId }),
        ...(dateFrom || dateTo
            ? {
                createdAt: {
                    ...(dateFrom && { gte: dateFrom }),
                    ...(dateTo && { lte: dateTo }),
                },
            }
            : {}),
    };
    const [orders, total] = await Promise.all([
        db_1.default.order.findMany({
            where,
            include: {
                ...orderInclude,
                user: { select: { id: true, name: true, email: true } },
            },
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * limit,
            take: limit,
        }),
        db_1.default.order.count({ where }),
    ]);
    return {
        orders,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            hasNext: page < Math.ceil(total / limit),
            hasPrev: page > 1,
        },
    };
}
