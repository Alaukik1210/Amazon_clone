import { Response } from "express";
import { env } from "../config/env";

const isProduction = env.nodeEnv === "production";

// Cookie name used across the app
export const TOKEN_COOKIE = "token";

/** Set the JWT as a secure HttpOnly cookie */
export function setTokenCookie(res: Response, token: string): void {
  res.cookie(TOKEN_COOKIE, token, {
    httpOnly: true,              // JS cannot read this — XSS protection
    secure: isProduction,        // HTTPS only in production
    sameSite: isProduction ? "strict" : "lax", // CSRF protection; lax for dev (cross-port)
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms (matches JWT_EXPIRES_IN)
  });
}

/** Clear the auth cookie on logout */
export function clearTokenCookie(res: Response): void {
  res.clearCookie(TOKEN_COOKIE, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "strict" : "lax",
  });
}
