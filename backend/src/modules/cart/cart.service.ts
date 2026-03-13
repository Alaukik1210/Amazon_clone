import { Prisma, ProductStatus } from "@prisma/client";
import prisma from "../../config/db";
import { AppError } from "../../utils/AppError";

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
    orderBy: { createdAt: "asc" as const },
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

// Attaches computed total to cart response so frontend doesn't recalculate
function withTotal(cart: {
  items: Array<{ quantity: number; product: { price: unknown } }>;
  [key: string]: unknown;
}) {
  const total = cart.items.reduce((sum, item) => {
    return sum + Number(item.product.price) * item.quantity;
  }, 0);

  return { ...cart, total: Number(total.toFixed(2)) };
}

// ── Service methods ───────────────────────────────────────────────────────────

export async function getCart(userId: string) {
  // Return empty cart shape if user hasn't added anything yet
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: cartInclude,
  });

  if (!cart) return { items: [], total: 0 };

  return withTotal(cart);
}

export async function addItem(userId: string, data: { productId: string; quantity: number }) {
  const product = await prisma.product.findUnique({ where: { id: data.productId } });

  if (!product) throw new AppError("Product not found", 404);
  if (product.status !== ProductStatus.ACTIVE) throw new AppError("Product is not available", 400);
  if (product.stock < data.quantity) {
    throw new AppError(`Only ${product.stock} unit(s) available in stock`, 400);
  }

  // Create cart if this is the user's first item (lazy cart creation)
  const cart = await prisma.cart.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });

  // Check if product already in cart
  const existingItem = await prisma.cartItem.findUnique({
    where: { cartId_productId: { cartId: cart.id, productId: data.productId } },
  });

  if (existingItem) {
    const newQuantity = existingItem.quantity + data.quantity;

    // Validate combined quantity against stock
    if (newQuantity > product.stock) {
      throw new AppError(
        `Cannot add ${data.quantity} more — only ${product.stock - existingItem.quantity} unit(s) can be added (${product.stock} in stock, ${existingItem.quantity} already in cart)`,
        400
      );
    }

    await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity: newQuantity },
    });
  } else {
    try {
      await prisma.cartItem.create({
        data: { cartId: cart.id, productId: data.productId, quantity: data.quantity },
      });
    } catch (error) {
      // Race condition safety: if another request inserted same cart+product first, update instead of failing.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        const racedItem = await prisma.cartItem.findUnique({
          where: { cartId_productId: { cartId: cart.id, productId: data.productId } },
        });

        if (!racedItem) throw error;

        const newQuantity = racedItem.quantity + data.quantity;
        if (newQuantity > product.stock) {
          throw new AppError(
            `Cannot add ${data.quantity} more — only ${product.stock - racedItem.quantity} unit(s) can be added (${product.stock} in stock, ${racedItem.quantity} already in cart)`,
            400
          );
        }

        await prisma.cartItem.update({
          where: { id: racedItem.id },
          data: { quantity: newQuantity },
        });
      } else {
        throw error;
      }
    }
  }

  // Return updated full cart
  const updated = await prisma.cart.findUnique({ where: { userId }, include: cartInclude });
  return withTotal(updated!);
}

export async function updateItem(
  userId: string,
  itemId: string,
  quantity: number
) {
  // Verify item belongs to this user's cart (prevents horizontal privilege escalation)
  const item = await prisma.cartItem.findFirst({
    where: { id: itemId, cart: { userId } },
    include: { product: true },
  });

  if (!item) throw new AppError("Cart item not found", 404);

  // quantity = 0 means user wants to remove the item
  if (quantity === 0) {
    await prisma.cartItem.delete({ where: { id: itemId } });
  } else {
    if (quantity > item.product.stock) {
      throw new AppError(`Only ${item.product.stock} unit(s) available in stock`, 400);
    }
    await prisma.cartItem.update({ where: { id: itemId }, data: { quantity } });
  }

  const cart = await prisma.cart.findUnique({ where: { userId }, include: cartInclude });
  return withTotal(cart!);
}

export async function removeItem(userId: string, itemId: string) {
  // Verify ownership before deleting
  const item = await prisma.cartItem.findFirst({
    where: { id: itemId, cart: { userId } },
  });

  if (!item) throw new AppError("Cart item not found", 404);

  await prisma.cartItem.delete({ where: { id: itemId } });

  const cart = await prisma.cart.findUnique({ where: { userId }, include: cartInclude });
  return withTotal(cart!);
}

export async function clearCart(userId: string) {
  const cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) return; // nothing to clear

  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
}
