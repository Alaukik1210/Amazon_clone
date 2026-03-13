import { Prisma, OrderStatus, PaymentMode, PaymentStatus, ProductStatus } from "@prisma/client";
import prisma from "../../config/db";
import { AppError } from "../../utils/AppError";
import { sendEmail } from "../../utils/email";
import { buildOrderConfirmationEmail } from "../../utils/emailTemplates";
import { buildOrderInvoicePdf } from "./order.invoice";
import type { OrderQuery, AdminOrderQuery } from "./order.validation";

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
} satisfies Prisma.OrderInclude;

// ── Shared helpers ────────────────────────────────────────────────────────────

/** Validate cart: ensure not empty, all products ACTIVE and in stock. */
async function validateCart(userId: string) {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: { items: { include: { product: true } } },
  });

  if (!cart || cart.items.length === 0) throw new AppError("Your cart is empty", 400);

  const errors: string[] = [];
  for (const item of cart.items) {
    if (item.product.status !== ProductStatus.ACTIVE) {
      errors.push(`"${item.product.title}" is no longer available`);
    } else if (item.product.stock < item.quantity) {
      errors.push(`"${item.product.title}" only has ${item.product.stock} unit(s) in stock (you requested ${item.quantity})`);
    }
  }
  if (errors.length > 0) throw new AppError(errors.join(", "), 400);

  return cart;
}

/** Deduct stock for each item, clear the cart — runs inside a transaction. */
async function finalizeOrder(
  tx: Prisma.TransactionClient,
  orderId: string,
  cartId: string,
  items: Array<{ productId: string; quantity: number; product: { title: string } }>,
  options: { markAsPaid: boolean }
) {
  for (const item of items) {
    // Atomic decrement prevents race conditions where concurrent checkouts oversell stock.
    const updated = await tx.product.updateMany({
      where: {
        id: item.productId,
        status: ProductStatus.ACTIVE,
        stock: { gte: item.quantity },
      },
      data: {
        stock: { decrement: item.quantity },
      },
    });

    if (updated.count !== 1) {
      throw new AppError(
        `\"${item.product.title}\" is no longer available in the requested quantity`,
        409
      );
    }
  }

  await tx.product.updateMany({
    where: {
      id: { in: items.map((item) => item.productId) },
      stock: { lte: 0 },
    },
    data: { status: ProductStatus.OUT_OF_STOCK },
  });

  await tx.cartItem.deleteMany({ where: { cartId } });

  return tx.order.update({
    where: { id: orderId },
    data: {
      ...(options.markAsPaid ? { paymentStatus: PaymentStatus.PAID } : {}),
    },
    include: orderInclude,
  });
}

/** Fire-and-forget confirmation email — never blocks order response. */
async function sendConfirmationEmail(userId: string, order: Prisma.OrderGetPayload<{ include: typeof orderInclude }>) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true } });
  if (!user) return;
  const html = buildOrderConfirmationEmail({
    userName: user.name ?? "Customer",
    orderId: order.id,
    createdAt: order.createdAt,
    items: order.items as Array<{ quantity: number; price: Prisma.Decimal; product: { title: string } }>,
    totalAmount: order.totalAmount,
    shippingAddress: order.shippingAddress as { street: string; city: string; state: string; postalCode: string; country: string },
  });
  sendEmail(user.email, "Your order has been placed! 🛒", html).catch((err) => {
    console.error("[Order Email] Failed to send confirmation:", err?.message);
  });
}

// ── Place Order ───────────────────────────────────────────────────────────────

export async function placeOrder(userId: string, addressId: string, paymentMode: PaymentMode) {
  // 1. Verify address belongs to user
  const address = await prisma.address.findUnique({ where: { id: addressId } });
  if (!address || address.userId !== userId) throw new AppError("Address not found", 404);

  // 2. Validate cart (throws on empty / unavailable / insufficient stock)
  const cart = await validateCart(userId);

  // 3. Calculate total
  const totalAmount = cart.items.reduce(
    (sum, item) => sum.plus(new Prisma.Decimal(item.product.price).mul(item.quantity)),
    new Prisma.Decimal(0)
  );

  if (paymentMode === PaymentMode.RAZORPAY) {
    throw new AppError("Online payment is temporarily unavailable. Please use Cash on Delivery.", 400);
  }

  // ── COD / TEST_BYPASS: place order + deduct stock immediately ──────────────
  if (paymentMode === PaymentMode.COD || paymentMode === PaymentMode.TEST_BYPASS) {
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          userId,
          addressId,
          totalAmount,
          paymentMode,
          status: OrderStatus.PENDING,
          paymentStatus: paymentMode === PaymentMode.COD ? PaymentStatus.PENDING : PaymentStatus.PAID,
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
        markAsPaid: paymentMode === PaymentMode.TEST_BYPASS,
      });
    });

    sendConfirmationEmail(userId, order);
    return { order };
  }
}

// ── My Orders ─────────────────────────────────────────────────────────────────

export async function getMyOrders(userId: string, filters: OrderQuery) {
  const { status, page, limit } = filters;

  const where: Prisma.OrderWhereInput = {
    userId,
    ...(status && { status }),
  };

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: orderInclude,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.order.count({ where }),
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

export async function getOrderById(orderId: string, userId: string, isAdmin: boolean) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      ...orderInclude,
      user: { select: { id: true, name: true, email: true } },
    },
  });

  if (!order) throw new AppError("Order not found", 404);

  // Customers can only view their own orders
  if (!isAdmin && order.userId !== userId) {
    throw new AppError("Order not found", 404); // same msg — don't leak existence
  }

  return order;
}

export async function generateOrderInvoice(orderId: string, userId: string, isAdmin: boolean) {
  const order = await getOrderById(orderId, userId, isAdmin);

  const pdfBuffer = await buildOrderInvoicePdf({
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

export async function cancelOrder(orderId: string, userId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });

  if (!order) throw new AppError("Order not found", 404);
  if (order.userId !== userId) throw new AppError("Order not found", 404);

  // Customers can only cancel PENDING orders
  if (order.status !== OrderStatus.PENDING) {
    throw new AppError(
      `Order cannot be cancelled — current status is ${order.status}. Only PENDING orders can be cancelled.`,
      400
    );
  }

  // Restore stock for each item on cancellation
  return prisma.$transaction(async (tx) => {
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
          ...(item.product.status === ProductStatus.OUT_OF_STOCK && {
            status: ProductStatus.ACTIVE,
          }),
        },
      });
    }

    return tx.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.CANCELLED,
        // Razorpay paid orders need manual refund (out of scope here)
        ...(order.paymentStatus === PaymentStatus.PAID && { paymentStatus: PaymentStatus.REFUNDED }),
      },
      include: orderInclude,
    });
  });
}

// ── Update Status (Admin) ─────────────────────────────────────────────────────

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new AppError("Order not found", 404);

  // Enforce logical status progression — can't go backwards
  const flow: OrderStatus[] = [
    OrderStatus.PENDING,
    OrderStatus.PROCESSING,
    OrderStatus.SHIPPED,
    OrderStatus.DELIVERED,
  ];

  const currentIdx = flow.indexOf(order.status);
  const newIdx = flow.indexOf(status);

  // Allow CANCELLED from any non-delivered status
  if (status === OrderStatus.CANCELLED) {
    if (order.status === OrderStatus.DELIVERED) {
      throw new AppError("Delivered orders cannot be cancelled", 400);
    }
  } else if (newIdx !== -1 && currentIdx !== -1 && newIdx < currentIdx) {
    throw new AppError(
      `Cannot move order from ${order.status} back to ${status}`,
      400
    );
  }

  return prisma.order.update({
    where: { id: orderId },
    data: { status },
    include: orderInclude,
  });
}

// ── Admin: All Orders ─────────────────────────────────────────────────────────

export async function getAllOrders(filters: AdminOrderQuery) {
  const { status, userId, dateFrom, dateTo, page, limit } = filters;

  const where: Prisma.OrderWhereInput = {
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
    prisma.order.findMany({
      where,
      include: {
        ...orderInclude,
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.order.count({ where }),
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


