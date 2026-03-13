"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLogger = requestLogger;
// Logs every incoming HTTP request with method, path, status and response time
// Format: [Request] POST /api/v1/auth/login 200 - 142ms
function requestLogger(req, res, next) {
    const start = Date.now();
    res.on("finish", () => {
        const duration = Date.now() - start;
        const level = res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info";
        console[level](`[Request] ${req.method} ${req.path} ${res.statusCode} - ${duration}ms`);
    });
    next();
}
