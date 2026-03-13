import crypto from "node:crypto";
import bcrypt from "bcryptjs";

// Generates a 6-digit numeric OTP
export function generateOtp(): string {
  return crypto.randomInt(100000, 999999).toString();
}

export async function hashOtp(otp: string): Promise<string> {
  return bcrypt.hash(otp, 10);
}

export async function verifyOtp(otp: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(otp, hashed);
}
