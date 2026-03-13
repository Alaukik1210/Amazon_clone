"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeBody = sanitizeBody;
const xss_1 = require("xss");
/**
 * Recursively sanitize all string values in an object.
 * Strips HTML tags and script injection attempts.
 */
function sanitizeValue(value) {
    if (typeof value === "string")
        return (0, xss_1.filterXSS)(value);
    if (Array.isArray(value))
        return value.map(sanitizeValue);
    if (value !== null && typeof value === "object") {
        return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, sanitizeValue(v)]));
    }
    return value;
}
/**
 * Middleware that sanitizes req.body in-place before it reaches controllers.
 * Prevents stored XSS via user-submitted string fields.
 */
function sanitizeBody(req, _res, next) {
    if (req.body && typeof req.body === "object") {
        req.body = sanitizeValue(req.body);
    }
    next();
}
