"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerWithPassword = registerWithPassword;
exports.loginWithPassword = loginWithPassword;
exports.sendOtp = sendOtp;
exports.verifyOtpAndAuth = verifyOtpAndAuth;
exports.getMe = getMe;
exports.updateProfile = updateProfile;
exports.changePassword = changePassword;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const client_1 = require("@prisma/client");
const db_1 = __importDefault(require("../../config/db"));
const AppError_1 = require("../../utils/AppError");
const jwt_1 = require("../../utils/jwt");
const otp_1 = require("../../utils/otp");
const email_1 = require("../../utils/email");
const OTP_EXPIRY_MINUTES = 10;
// ─── Password-based Auth ──────────────────────────────────────────────────────
async function registerWithPassword(data) {
    const existing = await db_1.default.user.findUnique({ where: { email: data.email } });
    if (existing)
        throw new AppError_1.AppError("Email already in use", 409);
    if (data.phone) {
        const phoneOwner = await db_1.default.user.findUnique({ where: { phone: data.phone } });
        if (phoneOwner)
            throw new AppError_1.AppError("Phone number already in use", 409);
    }
    const hashed = await bcryptjs_1.default.hash(data.password, 12);
    let user;
    try {
        user = await db_1.default.user.create({
            data: {
                name: data.name,
                email: data.email,
                password: hashed,
                phone: data.phone,
            },
        });
    }
    catch (error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            const target = Array.isArray(error.meta?.target) ? error.meta.target.join(",") : String(error.meta?.target ?? "");
            if (target.includes("phone")) {
                throw new AppError_1.AppError("Phone number already in use", 409);
            }
            if (target.includes("email")) {
                throw new AppError_1.AppError("Email already in use", 409);
            }
            throw new AppError_1.AppError("Account details already in use", 409);
        }
        throw error;
    }
    const token = (0, jwt_1.generateToken)(user.id, user.role);
    return { user: sanitize(user), token };
}
async function loginWithPassword(data) {
    const user = await db_1.default.user.findUnique({ where: { email: data.email } });
    // Same error for wrong email or wrong password — prevents user enumeration
    if (!user || !user.password) {
        throw new AppError_1.AppError("Invalid email or password", 401);
    }
    const isMatch = await bcryptjs_1.default.compare(data.password, user.password);
    if (!isMatch)
        throw new AppError_1.AppError("Invalid email or password", 401);
    const token = (0, jwt_1.generateToken)(user.id, user.role);
    return { user: sanitize(user), token };
}
// ─── OTP-based Auth ───────────────────────────────────────────────────────────
async function sendOtp(data) {
    const { email, purpose } = data;
    if (purpose === client_1.OtpPurpose.REGISTER) {
        // Allow REGISTER OTP for users who already created an account but are not yet email-verified.
        const existing = await db_1.default.user.findUnique({ where: { email } });
        if (existing && existing.isEmailVerified) {
            throw new AppError_1.AppError("Email already registered", 409);
        }
    }
    else {
        // LOGIN — user must exist
        const user = await db_1.default.user.findUnique({ where: { email } });
        if (!user)
            throw new AppError_1.AppError("No account found with this email", 404);
    }
    // Remove any previously sent OTPs for this email + purpose
    await db_1.default.otpVerification.deleteMany({ where: { email, purpose } });
    const otp = (0, otp_1.generateOtp)();
    const hashed = await (0, otp_1.hashOtp)(otp);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
    await db_1.default.otpVerification.create({ data: { email, otp: hashed, purpose, expiresAt } });
    try {
        await (0, email_1.sendEmail)(email, "Your OTP Code", `<p>Your OTP code is: <strong>${otp}</strong></p><p>It expires in ${OTP_EXPIRY_MINUTES} minutes.</p>`);
    }
    catch {
        throw new AppError_1.AppError("Unable to send OTP email right now. Please check mail configuration and try again.", 503);
    }
}
async function verifyOtpAndAuth(data) {
    const { email, otp, purpose, name, phone } = data;
    const record = await db_1.default.otpVerification.findFirst({
        where: { email, purpose },
        orderBy: { createdAt: "desc" },
    });
    if (!record)
        throw new AppError_1.AppError("OTP not found. Please request a new one.", 400);
    if (record.expiresAt < new Date())
        throw new AppError_1.AppError("OTP has expired", 400);
    const isValid = await (0, otp_1.verifyOtp)(otp, record.otp);
    if (!isValid)
        throw new AppError_1.AppError("Invalid OTP", 400);
    // Clean up used OTP
    await db_1.default.otpVerification.delete({ where: { id: record.id } });
    if (purpose === client_1.OtpPurpose.REGISTER) {
        // If account already exists (password-register flow), just mark verified.
        const existing = await db_1.default.user.findUnique({ where: { email } });
        const user = existing
            ? await db_1.default.user.update({
                where: { id: existing.id },
                data: {
                    isEmailVerified: true,
                    ...(name ? { name } : {}),
                    ...(phone ? { phone } : {}),
                },
            })
            : await db_1.default.user.create({
                data: {
                    name: name ?? null,
                    email,
                    phone,
                    isEmailVerified: true,
                },
            });
        const token = (0, jwt_1.generateToken)(user.id, user.role);
        return { user: sanitize(user), token };
    }
    else {
        // LOGIN
        const user = await db_1.default.user.findUnique({ where: { email } });
        if (!user)
            throw new AppError_1.AppError("User not found", 404);
        const token = (0, jwt_1.generateToken)(user.id, user.role);
        return { user: sanitize(user), token };
    }
}
// ─── Get Current User ─────────────────────────────────────────────────────────
async function getMe(userId) {
    const user = await db_1.default.user.findUnique({
        where: { id: userId },
        include: { addresses: true },
    });
    if (!user)
        throw new AppError_1.AppError("User not found", 404);
    return sanitize(user);
}
// ─── Profile Management ───────────────────────────────────────────────────────
async function updateProfile(userId, data) {
    // If phone is being updated, ensure it's not taken by another user
    if (data.phone) {
        const existing = await db_1.default.user.findFirst({
            where: { phone: data.phone, NOT: { id: userId } },
        });
        if (existing)
            throw new AppError_1.AppError("Phone number already in use", 409);
    }
    const user = await db_1.default.user.update({
        where: { id: userId },
        data: {
            ...(data.name && { name: data.name }),
            ...(data.phone && { phone: data.phone }),
        },
    });
    return sanitize(user);
}
async function changePassword(userId, currentPassword, newPassword) {
    const user = await db_1.default.user.findUnique({ where: { id: userId } });
    if (!user)
        throw new AppError_1.AppError("User not found", 404);
    // OTP-only users have no password set — they must use OTP to log in
    if (!user.password) {
        throw new AppError_1.AppError("Your account uses OTP login. You cannot set a password this way.", 400);
    }
    const isMatch = await bcryptjs_1.default.compare(currentPassword, user.password);
    if (!isMatch)
        throw new AppError_1.AppError("Current password is incorrect", 401);
    if (currentPassword === newPassword) {
        throw new AppError_1.AppError("New password must be different from current password", 400);
    }
    const hashed = await bcryptjs_1.default.hash(newPassword, 12);
    await db_1.default.user.update({ where: { id: userId }, data: { password: hashed } });
}
// ─── Helper ───────────────────────────────────────────────────────────────────
// Never return password hash to the client
function sanitize(user) {
    const { password: _, ...safe } = user;
    return safe;
}
