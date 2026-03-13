"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listAddresses = listAddresses;
exports.createAddress = createAddress;
exports.updateAddress = updateAddress;
exports.setDefault = setDefault;
exports.deleteAddress = deleteAddress;
const db_1 = __importDefault(require("../../config/db"));
const AppError_1 = require("../../utils/AppError");
// ── Helpers ───────────────────────────────────────────────────────────────────
// When setting a new default, unset all others first (in same tx)
async function ensureSingleDefault(userId, excludeId) {
    await db_1.default.address.updateMany({
        where: { userId, ...(excludeId && { id: { not: excludeId } }) },
        data: { isDefault: false },
    });
}
// Verify address exists AND belongs to requesting user — prevents horizontal escalation
async function findOwned(id, userId) {
    const address = await db_1.default.address.findUnique({ where: { id } });
    if (!address)
        throw new AppError_1.AppError("Address not found", 404);
    if (address.userId !== userId)
        throw new AppError_1.AppError("Address not found", 404); // same msg — don't leak existence
    return address;
}
// ── Service methods ───────────────────────────────────────────────────────────
async function listAddresses(userId) {
    return db_1.default.address.findMany({
        where: { userId },
        orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    });
}
async function createAddress(userId, data) {
    const count = await db_1.default.address.count({ where: { userId } });
    // First address is always default, regardless of what was sent
    const isDefault = count === 0 ? true : (data.isDefault ?? false);
    return db_1.default.$transaction(async (tx) => {
        if (isDefault) {
            await tx.address.updateMany({ where: { userId }, data: { isDefault: false } });
        }
        return tx.address.create({ data: { ...data, userId, isDefault } });
    });
}
async function updateAddress(id, userId, data) {
    await findOwned(id, userId);
    return db_1.default.$transaction(async (tx) => {
        if (data.isDefault) {
            await ensureSingleDefault(userId, id);
        }
        return tx.address.update({ where: { id }, data });
    });
}
async function setDefault(id, userId) {
    await findOwned(id, userId);
    return db_1.default.$transaction(async (tx) => {
        await ensureSingleDefault(userId, id);
        return tx.address.update({ where: { id }, data: { isDefault: true } });
    });
}
async function deleteAddress(id, userId) {
    const address = await findOwned(id, userId);
    // Check if this address is used by any pending/active orders
    const activeOrder = await db_1.default.order.findFirst({
        where: {
            addressId: id,
            status: { in: ["PENDING", "PROCESSING", "SHIPPED"] },
        },
    });
    if (activeOrder) {
        throw new AppError_1.AppError("Cannot delete — this address is used by an active order", 409);
    }
    await db_1.default.address.delete({ where: { id } });
    // If deleted address was default, promote the most recent remaining address
    if (address.isDefault) {
        const next = await db_1.default.address.findFirst({
            where: { userId },
            orderBy: { createdAt: "desc" },
        });
        if (next) {
            await db_1.default.address.update({ where: { id: next.id }, data: { isDefault: true } });
        }
    }
}
