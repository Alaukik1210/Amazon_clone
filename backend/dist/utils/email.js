"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyEmailTransport = verifyEmailTransport;
exports.sendEmail = sendEmail;
const nodemailer_1 = __importDefault(require("nodemailer"));
const env_1 = require("../config/env");
const transporter = nodemailer_1.default.createTransport({
    service: "gmail",
    auth: {
        user: env_1.env.emailFrom,
        pass: env_1.env.emailPass, // Gmail App Password (not your real password)
    },
});
let hasVerifiedTransport = false;
async function verifyEmailTransport() {
    if (hasVerifiedTransport)
        return;
    await transporter.verify();
    hasVerifiedTransport = true;
    console.info("[Email] SMTP transporter verified successfully.");
}
async function sendEmail(to, subject, html) {
    try {
        if (!hasVerifiedTransport) {
            await verifyEmailTransport();
        }
        await transporter.sendMail({ from: env_1.env.emailFrom, to, subject, html });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unknown email error";
        console.error("[Email] Failed to send email:", message);
        // Give an actionable hint for the most common Gmail auth failure.
        if (message.includes("Invalid login") || message.includes("Username and Password not accepted")) {
            console.error("[Email] Check EMAIL_FROM and EMAIL_PASS. For Gmail, EMAIL_PASS must be a 16-character App Password.");
        }
        throw error;
    }
}
