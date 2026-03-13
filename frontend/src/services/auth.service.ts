import api from "@/lib/api";
import type { ApiResponse, User } from "@/types";

export const authService = {
  register: (data: { name: string; email: string; password: string; phone?: string }) =>
    api.post<ApiResponse<User>>("/auth/register", data),

  login: (data: { email: string; password: string }) =>
    api.post<ApiResponse<User>>("/auth/login", data),

  logout: () => api.post("/auth/logout"),

  getMe: () => api.get<ApiResponse<User>>("/auth/me"),

  sendOtp: (data: { email: string; purpose: "REGISTER" | "LOGIN" }) =>
    api.post("/auth/otp/send", data),

  verifyOtp: (data: { email: string; otp: string; purpose: "REGISTER" | "LOGIN"; name?: string; phone?: string }) =>
    api.post<ApiResponse<User>>("/auth/otp/verify", data),

  updateProfile: (data: { name?: string; phone?: string }) =>
    api.put<ApiResponse<User>>("/auth/profile", data),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put("/auth/password", data),
};
