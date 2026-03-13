import { z } from "zod";

// ── Shared field rules ─────────────────────────────────────────────────────────

const emailField = z.email("Enter a valid email address");

const passwordField = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Must contain at least one uppercase letter")
  .regex(/[0-9]/, "Must contain at least one number");

const nameField = z
  .string()
  .min(2, "Name must be at least 2 characters")
  .max(60, "Name must be under 60 characters")
  .regex(/^[a-zA-Z\s]+$/, "Name can only contain letters and spaces");

const phoneField = z
  .string()
  .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number")
  .optional()
  .or(z.literal(""));

const otpField = z
  .string()
  .length(6, "OTP must be exactly 6 digits")
  .regex(/^\d{6}$/, "OTP must be numeric");

// ── Login schemas ──────────────────────────────────────────────────────────────

export const passwordLoginSchema = z.object({
  email:    emailField,
  password: z.string().min(1, "Password is required"),
});

export const otpRequestSchema = z.object({
  email: emailField,
});

export const otpVerifyLoginSchema = z.object({
  email: emailField,
  otp:   otpField,
});

// ── Register schemas ───────────────────────────────────────────────────────────

export const registerSchema = z
  .object({
    name:            nameField,
    email:           emailField,
    password:        passwordField,
    confirmPassword: z.string().min(1, "Please confirm your password"),
    phone:           phoneField,
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path:    ["confirmPassword"],
  });

export const registerOtpVerifySchema = z.object({
  otp: otpField,
});

// ── Profile schemas ────────────────────────────────────────────────────────────

export const updateProfileSchema = z.object({
  name:  nameField,
  phone: phoneField,
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword:     passwordField,
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path:    ["confirmPassword"],
  })
  .refine((d) => d.currentPassword !== d.newPassword, {
    message: "New password must be different from current password",
    path:    ["newPassword"],
  });

// ── Address schema ─────────────────────────────────────────────────────────────

export const addressSchema = z.object({
  street:     z.string().min(5, "Enter full street address"),
  city:       z.string().min(2, "Enter city name"),
  state:      z.string().min(2, "Enter state name"),
  postalCode: z.string().regex(/^\d{6}$/, "Enter valid 6-digit PIN code"),
  country:    z.string().min(2, "Enter country"),
});

// ── Inferred types ─────────────────────────────────────────────────────────────

export type PasswordLoginInput    = z.infer<typeof passwordLoginSchema>;
export type OtpRequestInput       = z.infer<typeof otpRequestSchema>;
export type OtpVerifyLoginInput   = z.infer<typeof otpVerifyLoginSchema>;
export type RegisterInput         = z.infer<typeof registerSchema>;
export type RegisterOtpVerifyInput = z.infer<typeof registerOtpVerifySchema>;
export type UpdateProfileInput    = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput   = z.infer<typeof changePasswordSchema>;
export type AddressInput          = z.infer<typeof addressSchema>;
