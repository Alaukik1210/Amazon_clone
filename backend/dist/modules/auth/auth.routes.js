"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController = __importStar(require("./auth.controller"));
const authenticate_1 = require("../../middlewares/authenticate");
const validate_1 = require("../../middlewares/validate");
const rateLimiter_1 = require("../../config/rateLimiter");
const auth_validation_1 = require("./auth.validation");
const router = (0, express_1.Router)();
// Password-based (rate-limited — 10 req / 15 min per IP)
router.post("/register", rateLimiter_1.authLimiter, (0, validate_1.validate)(auth_validation_1.registerSchema), authController.register);
router.post("/login", rateLimiter_1.authLimiter, (0, validate_1.validate)(auth_validation_1.loginSchema), authController.login);
// OTP-based (rate-limited — prevents OTP spam)
router.post("/otp/send", rateLimiter_1.authLimiter, (0, validate_1.validate)(auth_validation_1.sendOtpSchema), authController.sendOtp);
router.post("/otp/verify", rateLimiter_1.authLimiter, (0, validate_1.validate)(auth_validation_1.verifyOtpSchema), authController.verifyOtp);
// Protected profile routes
router.get("/me", authenticate_1.authenticate, authController.getMe);
router.post("/logout", authenticate_1.authenticate, authController.logout);
router.put("/profile", authenticate_1.authenticate, (0, validate_1.validate)(auth_validation_1.updateProfileSchema), authController.updateProfile);
router.put("/password", authenticate_1.authenticate, (0, validate_1.validate)(auth_validation_1.changePasswordSchema), authController.changePassword);
exports.default = router;
