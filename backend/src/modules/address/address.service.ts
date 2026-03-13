import prisma from "../../config/db";
import { AppError } from "../../utils/AppError";

// ── Helpers ───────────────────────────────────────────────────────────────────

// When setting a new default, unset all others first (in same tx)
async function ensureSingleDefault(userId: string, excludeId?: string) {
  await prisma.address.updateMany({
    where: { userId, ...(excludeId && { id: { not: excludeId } }) },
    data: { isDefault: false },
  });
}

// Verify address exists AND belongs to requesting user — prevents horizontal escalation
async function findOwned(id: string, userId: string) {
  const address = await prisma.address.findUnique({ where: { id } });
  if (!address) throw new AppError("Address not found", 404);
  if (address.userId !== userId) throw new AppError("Address not found", 404); // same msg — don't leak existence
  return address;
}

// ── Service methods ───────────────────────────────────────────────────────────

export async function listAddresses(userId: string) {
  return prisma.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });
}

export async function createAddress(
  userId: string,
  data: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    isDefault?: boolean;
  }
) {
  const count = await prisma.address.count({ where: { userId } });

  // First address is always default, regardless of what was sent
  const isDefault = count === 0 ? true : (data.isDefault ?? false);

  return prisma.$transaction(async (tx) => {
    if (isDefault) {
      await tx.address.updateMany({ where: { userId }, data: { isDefault: false } });
    }

    return tx.address.create({ data: { ...data, userId, isDefault } });
  });
}

export async function updateAddress(
  id: string,
  userId: string,
  data: Partial<{
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    isDefault: boolean;
  }>
) {
  await findOwned(id, userId);

  return prisma.$transaction(async (tx) => {
    if (data.isDefault) {
      await ensureSingleDefault(userId, id);
    }
    return tx.address.update({ where: { id }, data });
  });
}

export async function setDefault(id: string, userId: string) {
  await findOwned(id, userId);

  return prisma.$transaction(async (tx) => {
    await ensureSingleDefault(userId, id);
    return tx.address.update({ where: { id }, data: { isDefault: true } });
  });
}

export async function deleteAddress(id: string, userId: string) {
  const address = await findOwned(id, userId);

  // Check if this address is used by any pending/active orders
  const activeOrder = await prisma.order.findFirst({
    where: {
      addressId: id,
      status: { in: ["PENDING", "PROCESSING", "SHIPPED"] },
    },
  });

  if (activeOrder) {
    throw new AppError("Cannot delete — this address is used by an active order", 409);
  }

  await prisma.address.delete({ where: { id } });

  // If deleted address was default, promote the most recent remaining address
  if (address.isDefault) {
    const next = await prisma.address.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    if (next) {
      await prisma.address.update({ where: { id: next.id }, data: { isDefault: true } });
    }
  }
}
