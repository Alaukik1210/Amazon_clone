import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
import { AppError } from "../utils/AppError";

// Validates req.body against a Zod schema before reaching the controller
export function validate(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const message = result.error.issues[0]?.message ?? "Validation failed";
      return next(new AppError(message, 400));
    }

    req.body = result.data;
    next();
  };
}

// Validates req.query — stores parsed+coerced result in res.locals.query
// Express 5 makes req.query read-only, so we cannot reassign it
export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      const message = result.error.issues[0]?.message ?? "Invalid query parameters";
      return next(new AppError(message, 400));
    }

    res.locals.query = result.data;
    next();
  };
}
