import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";
import { AppError } from "../utils/AppError";

// Reads JWT from HttpOnly cookie — JS on the frontend cannot access this cookie
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const token = req.cookies?.token;

  if (!token) {
    return next(new AppError("Authentication required", 401));
  }

  try {
    const payload = verifyToken(token);
    req.user = { id: payload.userId, role: payload.role };
    next();
  } catch {
    next(new AppError("Invalid or expired session. Please log in again.", 401));
  }
}
