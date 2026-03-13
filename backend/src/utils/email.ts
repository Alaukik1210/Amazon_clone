import nodemailer from "nodemailer";
import { env } from "../config/env";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: env.emailFrom,
    pass: env.emailPass, // Gmail App Password (not your real password)
  },
});

let hasVerifiedTransport = false;

export async function verifyEmailTransport(): Promise<void> {
  if (hasVerifiedTransport) return;

  await transporter.verify();
  hasVerifiedTransport = true;
  console.info("[Email] SMTP transporter verified successfully.");
}

export async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<void> {
  try {
    if (!hasVerifiedTransport) {
      await verifyEmailTransport();
    }

    await transporter.sendMail({ from: env.emailFrom, to, subject, html });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown email error";
    console.error("[Email] Failed to send email:", message);

    // Give an actionable hint for the most common Gmail auth failure.
    if (message.includes("Invalid login") || message.includes("Username and Password not accepted")) {
      console.error("[Email] Check EMAIL_FROM and EMAIL_PASS. For Gmail, EMAIL_PASS must be a 16-character App Password.");
    }

    throw error;
  }
}
