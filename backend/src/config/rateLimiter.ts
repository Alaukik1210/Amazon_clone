import rateLimit from "express-rate-limit";

/**
 * Strict limiter for auth endpoints — prevents brute force / OTP spam.
 * 10 requests per 15 minutes per IP.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,  // Return RateLimit-* headers
  legacyHeaders: false,
  message: { success: false, message: "Too many requests, please try again after 15 minutes." },
});

/**
 * General API limiter — loose guard against scraping / abuse.
 * 100 requests per minute per IP.
 */
export const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests, please slow down." },
});
