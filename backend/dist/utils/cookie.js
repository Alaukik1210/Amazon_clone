"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TOKEN_COOKIE = void 0;
exports.setTokenCookie = setTokenCookie;
exports.clearTokenCookie = clearTokenCookie;
const env_1 = require("../config/env");
const isProduction = env_1.env.nodeEnv === "production";
// Cookie name used across the app
exports.TOKEN_COOKIE = "token";
/** Set the JWT as a secure HttpOnly cookie */
function setTokenCookie(res, token) {
    res.cookie(exports.TOKEN_COOKIE, token, {
        httpOnly: true, // JS cannot read this — XSS protection
        secure: isProduction, // HTTPS only in production
        sameSite: isProduction ? "strict" : "lax", // CSRF protection; lax for dev (cross-port)
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms (matches JWT_EXPIRES_IN)
    });
}
/** Clear the auth cookie on logout */
function clearTokenCookie(res) {
    res.clearCookie(exports.TOKEN_COOKIE, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "strict" : "lax",
    });
}
