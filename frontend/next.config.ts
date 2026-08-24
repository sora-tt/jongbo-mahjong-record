import type { NextConfig } from "next";

const backendApiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ||
  process.env.BACKEND_VERCEL_URL?.trim();

const nextConfig: NextConfig = {
  async rewrites() {
    if (!backendApiBaseUrl) {
      return [];
    }

    return [
      {
        source: "/api/:path*",
        destination: `${backendApiBaseUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
