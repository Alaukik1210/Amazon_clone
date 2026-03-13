import bcrypt from "bcryptjs";
import { OtpPurpose, Prisma } from "@prisma/client";
import prisma from "../../config/db";
import { AppError } from "../../utils/AppError";
import { generateToken } from "../../utils/jwt";
import { generateOtp, hashOtp, verifyOtp } from "../../utils/otp";
import { sendEmail } from "../../utils/email";

const OTP_EXPIRY_MINUTES = 10;

// ─── Password-based Auth ──────────────────────────────────────────────────────

export async function registerWithPassword(data: {
  name: string;
  email: string;
  password: string;
  phone?: string;
}) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw new AppError("Email already in use", 409);

  if (data.phone) {
    const phoneOwner = await prisma.user.findUnique({ where: { phone: data.phone } });
    if (phoneOwner) throw new AppError("Phone number already in use", 409);
  }

  const hashed = await bcrypt.hash(data.password, 12);

  let user;
  try {
    user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashed,
        phone: data.phone,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const target = Array.isArray(error.meta?.target) ? error.meta.target.join(",") : String(error.meta?.target ?? "");
      if (target.includes("phone")) {
        throw new AppError("Phone number already in use", 409);
      }
      if (target.includes("email")) {
        throw new AppError("Email already in use", 409);
      }
      throw new AppError("Account details already in use", 409);
    }
    throw error;
  }

  const token = generateToken(user.id, user.role);
  return { user: sanitize(user), token };
}

export async function loginWithPassword(data: { email: string; password: string }) {
  const user = await prisma.user.findUnique({ where: { email: data.email } });

  // Same error for wrong email or wrong password — prevents user enumeration
  if (!user || !user.password) {
    throw new AppError("Invalid email or password", 401);
  }

  const isMatch = await bcrypt.compare(data.password, user.password);
  if (!isMatch) throw new AppError("Invalid email or password", 401);

  const token = generateToken(user.id, user.role);
  return { user: sanitize(user), token };
}

// ─── OTP-based Auth ───────────────────────────────────────────────────────────

export async function sendOtp(data: { email: string; purpose: OtpPurpose }) {
  const { email, purpose } = data;

  if (purpose === OtpPurpose.REGISTER) {
    // Allow REGISTER OTP for users who already created an account but are not yet email-verified.
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing && existing.isEmailVerified) {
      throw new AppError("Email already registered", 409);
    }
  } else {
    // LOGIN — user must exist
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new AppError("No account found with this email", 404);
  }

  // Remove any previously sent OTPs for this email + purpose
  await prisma.otpVerification.deleteMany({ where: { email, purpose } });

  const otp = generateOtp();
  const hashed = await hashOtp(otp);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await prisma.otpVerification.create({ data: { email, otp: hashed, purpose, expiresAt } });

  try {
    await sendEmail(
      email,
      "Your OTP Code",
      `<p>Your OTP code is: <strong>${otp}</strong></p><p>It expires in ${OTP_EXPIRY_MINUTES} minutes.</p>`
    );
  } catch {
    throw new AppError(
      "Unable to send OTP email right now. Please check mail configuration and try again.",
      503
    );
  }
}

export async function verifyOtpAndAuth(data: {
  email: string;
  otp: string;
  purpose: OtpPurpose;
  name?: string;
  phone?: string;
}) {
  const { email, otp, purpose, name, phone } = data;

  const record = await prisma.otpVerification.findFirst({
    where: { email, purpose },
    orderBy: { createdAt: "desc" },
  });

  if (!record) throw new AppError("OTP not found. Please request a new one.", 400);
  if (record.expiresAt < new Date()) throw new AppError("OTP has expired", 400);

  const isValid = await verifyOtp(otp, record.otp);
  if (!isValid) throw new AppError("Invalid OTP", 400);

  // Clean up used OTP
  await prisma.otpVerification.delete({ where: { id: record.id } });

  if (purpose === OtpPurpose.REGISTER) {
    // If account already exists (password-register flow), just mark verified.
    const existing = await prisma.user.findUnique({ where: { email } });

    const user = existing
      ? await prisma.user.update({
          where: { id: existing.id },
          data: {
            isEmailVerified: true,
            ...(name ? { name } : {}),
            ...(phone ? { phone } : {}),
          },
        })
      : await prisma.user.create({
          data: {
            name: name ?? null,
            email,
            phone,
            isEmailVerified: true,
          },
        });

    const token = generateToken(user.id, user.role);
    return { user: sanitize(user), token };
  } else {
    // LOGIN
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new AppError("User not found", 404);

    const token = generateToken(user.id, user.role);
    return { user: sanitize(user), token };
  }
}

// ─── Get Current User ─────────────────────────────────────────────────────────

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { addresses: true },
  });

  if (!user) throw new AppError("User not found", 404);
  return sanitize(user);
}

// ─── Profile Management ───────────────────────────────────────────────────────

export async function updateProfile(userId: string, data: { name?: string; phone?: string }) {
  // If phone is being updated, ensure it's not taken by another user
  if (data.phone) {
    const existing = await prisma.user.findFirst({
      where: { phone: data.phone, NOT: { id: userId } },
    });
    if (existing) throw new AppError("Phone number already in use", 409);
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.phone && { phone: data.phone }),
    },
  });

  return sanitize(user);
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError("User not found", 404);

  // OTP-only users have no password set — they must use OTP to log in
  if (!user.password) {
    throw new AppError("Your account uses OTP login. You cannot set a password this way.", 400);
  }

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) throw new AppError("Current password is incorrect", 401);

  if (currentPassword === newPassword) {
    throw new AppError("New password must be different from current password", 400);
  }

  const hashed = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: userId }, data: { password: hashed } });
}

// ─── Helper ───────────────────────────────────────────────────────────────────

// Never return password hash to the client
function sanitize<T extends { password?: string | null }>(user: T) {
  const { password: _, ...safe } = user;
  return safe;
}
