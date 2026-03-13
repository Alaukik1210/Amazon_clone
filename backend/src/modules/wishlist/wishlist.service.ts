import { ProductStatus } from "@prisma/client";
import prisma from "../../config/db";
import { AppError } from "../../utils/AppError";

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
    orderBy: { createdAt: "desc" as const },
  },
};

export async function getWishlist(userId: string) {
  const wishlist = await prisma.wishlist.findUnique({
    where: { userId },
    include: wishlistInclude,
  });

  // Return empty shape if no wishlist exists yet
  if (!wishlist) return { items: [] };

  return wishlist;
}

export async function addItem(userId: string, productId: string) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new AppError("Product not found", 404);

  // Discontinued products shouldn't be wish-listable
  if (product.status === ProductStatus.DISCONTINUED) {
    throw new AppError("Product is not available", 400);
  }

  // Create wishlist lazily on first add
  const wishlist = await prisma.wishlist.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });

  // @@unique([wishlistId, productId]) prevents duplicates at DB level
  // but we return a friendly error instead of a constraint crash
  const existing = await prisma.wishlistItem.findUnique({
    where: { wishlistId_productId: { wishlistId: wishlist.id, productId } },
  });

  if (existing) throw new AppError("Product is already in your wishlist", 409);

  await prisma.wishlistItem.create({
    data: { wishlistId: wishlist.id, productId },
  });

  return prisma.wishlist.findUnique({ where: { userId }, include: wishlistInclude });
}

export async function removeItem(userId: string, itemId: string) {
  // Verify ownership
  const item = await prisma.wishlistItem.findFirst({
    where: { id: itemId, wishlist: { userId } },
  });

  if (!item) throw new AppError("Wishlist item not found", 404);

  await prisma.wishlistItem.delete({ where: { id: itemId } });

  return prisma.wishlist.findUnique({ where: { userId }, include: wishlistInclude });
}

export async function moveToCart(userId: string, itemId: string) {
  // Verify ownership
  const item = await prisma.wishlistItem.findFirst({
    where: { id: itemId, wishlist: { userId } },
    include: { product: true },
  });

  if (!item) throw new AppError("Wishlist item not found", 404);

  const product = item.product;

  if (product.status !== ProductStatus.ACTIVE) {
    throw new AppError("Product is not available to add to cart", 400);
  }

  if (product.stock < 1) {
    throw new AppError("Product is out of stock", 400);
  }

  // Add to cart (create cart lazily if needed)
  const cart = await prisma.cart.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });

  const existingCartItem = await prisma.cartItem.findUnique({
    where: { cartId_productId: { cartId: cart.id, productId: product.id } },
  });

  if (existingCartItem) {
    const newQty = existingCartItem.quantity + 1;
    if (newQty > product.stock) {
      throw new AppError(`Only ${product.stock} unit(s) in stock and you already have ${existingCartItem.quantity} in cart`, 400);
    }
    await prisma.cartItem.update({ where: { id: existingCartItem.id }, data: { quantity: newQty } });
  } else {
    await prisma.cartItem.create({ data: { cartId: cart.id, productId: product.id, quantity: 1 } });
  }

  // Remove from wishlist after successful cart add
  await prisma.wishlistItem.delete({ where: { id: itemId } });

  return prisma.wishlist.findUnique({ where: { userId }, include: wishlistInclude });
}
