"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const AppError_1 = require("../utils/AppError");
const errorHandler = (err, req, res, _next) => {
    // Operational error — thrown intentionally by our code (e.g. 404, 409, 401)
    if (err instanceof AppError_1.AppError) {
        // Only log 5xx operational errors; 4xx are expected user mistakes, not server issues
        if (err.statusCode >= 500) {
            console.error(`[Error] ${req.method} ${req.path} - ${err.statusCode}`, err.stack);
        }
        res.status(err.statusCode).json({
            success: false,
            message: err.message,
        });
        return;
    }
    // Unexpected error — a real bug (DB down, null ref, etc.)
    // Always log full stack so we can debug
    const error = err;
    console.error(`[Unexpected Error] ${req.method} ${req.path}`, error);
    res.status(500).json({
        success: false,
        message: "Something went wrong. Please try again later.",
        // Show stack only in development — never expose internals in production
        ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
    });
};
exports.errorHandler = errorHandler;
