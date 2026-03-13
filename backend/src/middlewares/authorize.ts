import { Request, Response, NextFunction } from "express";
import type { Role } from "@prisma/client";
import { AppError } from "../utils/AppError";

// Use after authenticate middleware. Checks if user's role is allowed.
// Usage: router.delete("/...", authenticate, authorize("ADMIN"), controller)
export function authorize(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError("You do not have permission to perform this action", 403));
    }
    next();
  };
}
