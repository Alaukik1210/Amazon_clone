"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = validate;
exports.validateQuery = validateQuery;
const AppError_1 = require("../utils/AppError");
// Validates req.body against a Zod schema before reaching the controller
function validate(schema) {
    return (req, _res, next) => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            const message = result.error.issues[0]?.message ?? "Validation failed";
            return next(new AppError_1.AppError(message, 400));
        }
        req.body = result.data;
        next();
    };
}
// Validates req.query — stores parsed+coerced result in res.locals.query
// Express 5 makes req.query read-only, so we cannot reassign it
function validateQuery(schema) {
    return (req, res, next) => {
        const result = schema.safeParse(req.query);
        if (!result.success) {
            const message = result.error.issues[0]?.message ?? "Invalid query parameters";
            return next(new AppError_1.AppError(message, 400));
        }
        res.locals.query = result.data;
        next();
    };
}
