import { Request, Response, NextFunction } from "express";
import { OtpPurpose } from "@prisma/client";
import * as authService from "./auth.service";
import { setTokenCookie, clearTokenCookie } from "../../utils/cookie";

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { user, token } = await authService.registerWithPassword(req.body);
    setTokenCookie(res, token);
    res.status(201).json({ success: true, data: user }); // token in cookie, not body
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { user, token } = await authService.loginWithPassword(req.body);
    setTokenCookie(res, token);
    res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
}

export async function logout(_req: Request, res: Response) {
  clearTokenCookie(res);
  res.status(200).json({ success: true, message: "Logged out successfully" });
}

export async function sendOtp(req: Request, res: Response, next: NextFunction) {
  try {
    await authService.sendOtp(req.body);
    res.status(200).json({ success: true, message: "OTP sent to your email" });
  } catch (err) {
    next(err);
  }
}

export async function verifyOtp(req: Request, res: Response, next: NextFunction) {
  try {
    const { user, token } = await authService.verifyOtpAndAuth({
      ...req.body,
      purpose: req.body.purpose as OtpPurpose,
    });
    setTokenCookie(res, token);
    res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
}

export async function getMe(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await authService.getMe(req.user!.id);
    res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await authService.updateProfile(req.user!.id, req.body);
    res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
}

export async function changePassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { currentPassword, newPassword } = req.body;
    await authService.changePassword(req.user!.id, currentPassword, newPassword);
    // Force re-login after password change — clear the cookie
    clearTokenCookie(res);
    res.status(200).json({ success: true, message: "Password changed. Please log in again." });
  } catch (err) {
    next(err);
  }
}
