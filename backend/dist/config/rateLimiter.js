"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generalLimiter = exports.authLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
/**
 * Strict limiter for auth endpoints — prevents brute force / OTP spam.
 * 10 requests per 15 minutes per IP.
 */
exports.authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    standardHeaders: true, // Return RateLimit-* headers
    legacyHeaders: false,
    message: { success: false, message: "Too many requests, please try again after 15 minutes." },
});
/**
 * General API limiter — loose guard against scraping / abuse.
 * 100 requests per minute per IP.
 */
exports.generalLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000, // 1 minute
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "Too many requests, please slow down." },
});
