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
exports.register = register;
exports.login = login;
exports.logout = logout;
exports.sendOtp = sendOtp;
exports.verifyOtp = verifyOtp;
exports.getMe = getMe;
exports.updateProfile = updateProfile;
exports.changePassword = changePassword;
const authService = __importStar(require("./auth.service"));
const cookie_1 = require("../../utils/cookie");
async function register(req, res, next) {
    try {
        const { user, token } = await authService.registerWithPassword(req.body);
        (0, cookie_1.setTokenCookie)(res, token);
        res.status(201).json({ success: true, data: user }); // token in cookie, not body
    }
    catch (err) {
        next(err);
    }
}
async function login(req, res, next) {
    try {
        const { user, token } = await authService.loginWithPassword(req.body);
        (0, cookie_1.setTokenCookie)(res, token);
        res.status(200).json({ success: true, data: user });
    }
    catch (err) {
        next(err);
    }
}
async function logout(_req, res) {
    (0, cookie_1.clearTokenCookie)(res);
    res.status(200).json({ success: true, message: "Logged out successfully" });
}
async function sendOtp(req, res, next) {
    try {
        await authService.sendOtp(req.body);
        res.status(200).json({ success: true, message: "OTP sent to your email" });
    }
    catch (err) {
        next(err);
    }
}
async function verifyOtp(req, res, next) {
    try {
        const { user, token } = await authService.verifyOtpAndAuth({
            ...req.body,
            purpose: req.body.purpose,
        });
        (0, cookie_1.setTokenCookie)(res, token);
        res.status(200).json({ success: true, data: user });
    }
    catch (err) {
        next(err);
    }
}
async function getMe(req, res, next) {
    try {
        const user = await authService.getMe(req.user.id);
        res.status(200).json({ success: true, data: user });
    }
    catch (err) {
        next(err);
    }
}
async function updateProfile(req, res, next) {
    try {
        const user = await authService.updateProfile(req.user.id, req.body);
        res.status(200).json({ success: true, data: user });
    }
    catch (err) {
        next(err);
    }
}
async function changePassword(req, res, next) {
    try {
        const { currentPassword, newPassword } = req.body;
        await authService.changePassword(req.user.id, currentPassword, newPassword);
        // Force re-login after password change — clear the cookie
        (0, cookie_1.clearTokenCookie)(res);
        res.status(200).json({ success: true, message: "Password changed. Please log in again." });
    }
    catch (err) {
        next(err);
    }
}
