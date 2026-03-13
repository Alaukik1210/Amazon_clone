import axios from "axios";

const isBrowser = typeof window !== "undefined";
const browserBaseUrl = "/api/v1";
const serverBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

const api = axios.create({
  baseURL: isBrowser ? browserBaseUrl : serverBaseUrl,
  withCredentials: true, // send HttpOnly cookies on every request
  headers: { "Content-Type": "application/json" },
});

// Global response interceptor — normalize errors to a consistent shape
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ?? error.message ?? "Something went wrong";
    const normalized = new Error(message) as Error & { status?: number };
    normalized.status = error.response?.status;
    return Promise.reject(normalized);
  }
);

export default api;
