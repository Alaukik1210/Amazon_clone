"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = authorize;
const AppError_1 = require("../utils/AppError");
// Use after authenticate middleware. Checks if user's role is allowed.
// Usage: router.delete("/...", authenticate, authorize("ADMIN"), controller)
function authorize(...roles) {
    return (req, _res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return next(new AppError_1.AppError("You do not have permission to perform this action", 403));
        }
        next();
    };
}
