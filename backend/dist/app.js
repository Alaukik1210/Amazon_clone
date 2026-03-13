"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const routes_1 = __importDefault(require("./routes"));
const env_1 = require("./config/env");
const rateLimiter_1 = require("./config/rateLimiter");
const sanitize_1 = require("./middlewares/sanitize");
const error_middleware_1 = require("./middlewares/error.middleware");
const request_logger_1 = require("./middlewares/request-logger");
const app = (0, express_1.default)();
// ── Security headers — disable crossOriginResourcePolicy so browser can load
//    cross-origin responses (required when backend and frontend run on different ports)
app.use((0, helmet_1.default)({ crossOriginResourcePolicy: false }));
// ── CORS — credentials:true required for cookies to be sent cross-origin
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin || env_1.env.allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error(`CORS: origin '${origin}' is not allowed`));
        }
    },
    credentials: true, // MUST be true for cookies to work cross-origin
}));
app.use(express_1.default.json({ limit: "10kb" }));
app.use(express_1.default.urlencoded({ extended: true, limit: "10kb" }));
app.use((0, cookie_parser_1.default)()); // Parse cookies before routes
// ── Sanitize all string inputs before they reach controllers
app.use(sanitize_1.sanitizeBody);
app.use(request_logger_1.requestLogger);
// ── General rate limit on all API routes
app.use("/api/v1", rateLimiter_1.generalLimiter);
app.use("/api/v1", routes_1.default);
app.use(error_middleware_1.errorHandler);
exports.default = app;
