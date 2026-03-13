"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const razorpay_1 = __importDefault(require("razorpay"));
const env_1 = require("./env");
// Single Razorpay instance shared across the app
const razorpay = new razorpay_1.default({
    key_id: env_1.env.razorpayKeyId,
    key_secret: env_1.env.razorpayKeySecret,
});
exports.default = razorpay;
