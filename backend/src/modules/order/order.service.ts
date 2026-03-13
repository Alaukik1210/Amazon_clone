import crypto from "crypto";
import { Prisma, OrderStatus, PaymentMode, PaymentStatus, ProductStatus } from "@prisma/client";
import prisma from "../../config/db";
import razorpay from "../../config/razorpay";
import { AppError } from "../../utils/AppError";
import { env } from "../../config/env";
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
  items: Array<{ productId: string; quantity: number; product: { stock: number; status: ProductStatus } }>
) {
  for (const item of items) {
    const newStock = item.product.stock - item.quantity;
    await tx.product.update({
      where: { id: item.productId },
      data: {
        stock: newStock,
        ...(newStock === 0 && { status: ProductStatus.OUT_OF_STOCK }),
      },
    });
  }
  await tx.cartItem.deleteMany({ where: { cartId } });
  return tx.order.update({
    where: { id: orderId },
    data: { paymentStatus: PaymentStatus.PAID },
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

      return finalizeOrder(tx, newOrder.id, cart.id, cart.items);
    });

    sendConfirmationEmail(userId, order);
    return { order };
  }

  // ── RAZORPAY: create Razorpay order, save to DB (stock NOT deducted yet) ──
  // Amount must be in paise (smallest currency unit): ₹100 = 10000 paise
  const amountInPaise = Math.round(Number(totalAmount) * 100);

  const razorpayOrder = await razorpay.orders.create({
    amount: amountInPaise,
    currency: "INR",
    receipt: `rcpt_${Date.now()}`,
  });

  const order = await prisma.order.create({
    data: {
      userId,
      addressId,
      totalAmount,
      paymentMode: PaymentMode.RAZORPAY,
      status: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
      razorpayOrderId: razorpayOrder.id,
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

  // Return Razorpay order details + keyId so frontend can open the payment modal
  return {
    order,
    razorpayOrder: {
      id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
    },
    keyId: env.razorpayKeyId,
  };
}

// ── Verify Razorpay Payment ───────────────────────────────────────────────────

export async function verifyPayment(
  orderId: string,
  userId: string,
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
) {
  // 1. Load the order — verify ownership and that it's awaiting payment
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.userId !== userId) throw new AppError("Order not found", 404);
  if (order.paymentMode !== PaymentMode.RAZORPAY) throw new AppError("This order does not use Razorpay", 400);
  if (order.paymentStatus === PaymentStatus.PAID) throw new AppError("Order is already paid", 400);
  if (order.razorpayOrderId !== razorpayOrderId) throw new AppError("Razorpay order ID mismatch", 400);

  // 2. Verify HMAC-SHA256 signature
  // Razorpay signs: "<razorpay_order_id>|<razorpay_payment_id>" with KEY_SECRET
  const expectedSignature = crypto
    .createHmac("sha256", env.razorpayKeySecret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");

  if (expectedSignature !== razorpaySignature) {
    // Mark payment as failed so user can retry
    await prisma.order.update({
      where: { id: orderId },
      data: { paymentStatus: PaymentStatus.FAILED },
    });
    throw new AppError("Payment verification failed — invalid signature", 400);
  }

  // 3. Signature valid → load cart and finalize in a transaction
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: { items: { include: { product: true } } },
  });

  const paidOrder = await prisma.$transaction(async (tx) => {
    // Update razorpayPaymentId first
    await tx.order.update({
      where: { id: orderId },
      data: { razorpayPaymentId },
    });

    // Deduct stock + clear cart + mark PAID
    if (cart && cart.items.length > 0) {
      return finalizeOrder(tx, orderId, cart.id, cart.items);
    }

    // Cart already cleared (edge case: double verification attempt)
    return tx.order.update({
      where: { id: orderId },
      data: { paymentStatus: PaymentStatus.PAID },
      include: orderInclude,
    });
  });

  sendConfirmationEmail(userId, paidOrder);
  return paidOrder;
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


