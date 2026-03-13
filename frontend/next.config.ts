import type { NextConfig } from "next";

const DEFAULT_BACKEND_ORIGIN = "https://amazon-clone-1-fcwc.onrender.com";
const publicApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim() ?? "";
const rawBackendUrl =
  process.env.BACKEND_URL?.trim() ||
  (publicApiUrl.startsWith("http") ? publicApiUrl : "") ||
  DEFAULT_BACKEND_ORIGIN;
const backendOrigin = rawBackendUrl
  .replace(/\/api\/v1\/?$/, "")
  .replace(/\/$/, "");

const nextConfig: NextConfig = {
  outputFileTracingRoot: process.cwd(),
  async rewrites() {
    // Proxy API via same-origin route to avoid third-party cookie issues in browsers.
    if (!backendOrigin || backendOrigin.startsWith("/")) {
      return [];
    }

    return [
      {
        source: "/api/v1/:path*",
        destination: `${backendOrigin}/api/v1/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "placehold.co" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "example.com" },
    ],
  },
};

export default nextConfig;
