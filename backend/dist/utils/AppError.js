"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
// Centralized error class so any layer can throw: throw new AppError("Not found", 404)
// The global error middleware reads statusCode to send correct HTTP response
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.message = message;
        this.statusCode = statusCode;
        this.name = "AppError";
    }
}
exports.AppError = AppError;
