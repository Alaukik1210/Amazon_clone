"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateOtp = generateOtp;
exports.hashOtp = hashOtp;
exports.verifyOtp = verifyOtp;
const node_crypto_1 = __importDefault(require("node:crypto"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
// Generates a 6-digit numeric OTP
function generateOtp() {
    return node_crypto_1.default.randomInt(100000, 999999).toString();
}
async function hashOtp(otp) {
    return bcryptjs_1.default.hash(otp, 10);
}
async function verifyOtp(otp, hashed) {
    return bcryptjs_1.default.compare(otp, hashed);
}
