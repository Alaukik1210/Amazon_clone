"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
const jwt_1 = require("../utils/jwt");
const AppError_1 = require("../utils/AppError");
// Reads JWT from HttpOnly cookie — JS on the frontend cannot access this cookie
function authenticate(req, _res, next) {
    const token = req.cookies?.token;
    if (!token) {
        return next(new AppError_1.AppError("Authentication required", 401));
    }
    try {
        const payload = (0, jwt_1.verifyToken)(token);
        req.user = { id: payload.userId, role: payload.role };
        next();
    }
    catch {
        next(new AppError_1.AppError("Invalid or expired session. Please log in again.", 401));
    }
}
