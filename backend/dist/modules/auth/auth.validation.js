"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePasswordSchema = exports.updateProfileSchema = exports.verifyOtpSchema = exports.sendOtpSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
exports.registerSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(100),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8, "Password must be at least 8 characters"),
    phone: zod_1.z.string().optional(),
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1, "Password is required"),
});
exports.sendOtpSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    purpose: zod_1.z.enum(["REGISTER", "LOGIN"]),
});
// For OTP register: name is required. For OTP login: name is not needed.
exports.verifyOtpSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    otp: zod_1.z.string().length(6, "OTP must be 6 digits"),
    purpose: zod_1.z.enum(["REGISTER", "LOGIN"]),
    name: zod_1.z.string().min(2).max(100).optional(),
    phone: zod_1.z.string().optional(),
});
exports.updateProfileSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(100).optional(),
    phone: zod_1.z.string().min(7).max(15).optional(),
});
exports.changePasswordSchema = zod_1.z.object({
    currentPassword: zod_1.z.string().min(1, "Current password is required"),
    newPassword: zod_1.z
        .string()
        .min(8, "New password must be at least 8 characters")
        .regex(/[A-Z]/, "Must contain an uppercase letter")
        .regex(/[0-9]/, "Must contain a number"),
});
