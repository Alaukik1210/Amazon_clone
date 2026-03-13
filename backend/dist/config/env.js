"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
require("dotenv/config");
const DEFAULT_PORT = 8000;
function getRequiredEnv(name) {
    const value = process.env[name]?.trim();
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}
function getPort() {
    const rawPort = process.env.PORT;
    if (!rawPort) {
        return DEFAULT_PORT;
    }
    const port = Number(rawPort);
    if (!Number.isInteger(port) || port <= 0) {
        throw new Error("PORT must be a valid positive integer");
    }
    return port;
}
exports.env = {
    nodeEnv: process.env.NODE_ENV ?? "development",
    port: getPort(),
    databaseUrl: getRequiredEnv("DATABASE_URL"),
    jwtSecret: getRequiredEnv("JWT_SECRET"),
    jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
    emailFrom: getRequiredEnv("EMAIL_FROM"),
    // Google app passwords are often shown with spaces; strip them to prevent EAUTH failures.
    emailPass: getRequiredEnv("EMAIL_PASS").replace(/\s+/g, ""),
    // Comma-separated list of allowed origins, e.g. "http://localhost:3000,https://myapp.com"
    allowedOrigins: (process.env.ALLOWED_ORIGINS ?? "http://localhost:3000")
        .split(",")
        .map((o) => o.trim())
        .filter(Boolean),
    // Razorpay — get from https://dashboard.razorpay.com (test mode)
    razorpayKeyId: process.env.RAZORPAY_KEY_ID ?? "",
    razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET ?? "",
};
