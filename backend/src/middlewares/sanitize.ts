import { Request, Response, NextFunction } from "express";
import { filterXSS } from "xss";

/**
 * Recursively sanitize all string values in an object.
 * Strips HTML tags and script injection attempts.
 */
function sanitizeValue(value: unknown): unknown {
  if (typeof value === "string") return filterXSS(value);
  if (Array.isArray(value)) return value.map(sanitizeValue);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, sanitizeValue(v)])
    );
  }
  return value;
}

/**
 * Middleware that sanitizes req.body in-place before it reaches controllers.
 * Prevents stored XSS via user-submitted string fields.
 */
export function sanitizeBody(req: Request, _res: Response, next: NextFunction) {
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeValue(req.body) as Record<string, unknown>;
  }
  next();
}
