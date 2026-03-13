import { Router } from "express";
import * as authController from "./auth.controller";
import { authenticate } from "../../middlewares/authenticate";
import { validate } from "../../middlewares/validate";
import { authLimiter } from "../../config/rateLimiter";
import {
  registerSchema,
  loginSchema,
  sendOtpSchema,
  verifyOtpSchema,
  updateProfileSchema,
  changePasswordSchema,
} from "./auth.validation";

const router = Router();

// Password-based (rate-limited — 10 req / 15 min per IP)
router.post("/register", authLimiter, validate(registerSchema), authController.register);
router.post("/login", authLimiter, validate(loginSchema), authController.login);

// OTP-based (rate-limited — prevents OTP spam)
router.post("/otp/send", authLimiter, validate(sendOtpSchema), authController.sendOtp);
router.post("/otp/verify", authLimiter, validate(verifyOtpSchema), authController.verifyOtp);

// Protected profile routes
router.get("/me", authenticate, authController.getMe);
router.post("/logout", authenticate, authController.logout);
router.put("/profile", authenticate, validate(updateProfileSchema), authController.updateProfile);
router.put("/password", authenticate, validate(changePasswordSchema), authController.changePassword);

export default router;
