import type { NextConfig } from "next";

const backendVercelUrl = process.env.BACKEND_VERCEL_URL?.trim();

const normalizeBackendUrl = (value: string) => {
  const withProtocol =
    value.startsWith("http://") || value.startsWith("https://")
      ? value
      : `https://${value}`;

  return withProtocol.replace(/\/$/, "");
};

const nextConfig: NextConfig = {
  async rewrites() {
    if (!backendVercelUrl) {
      return [];
    }

    const destinationBaseUrl = normalizeBackendUrl(backendVercelUrl);

    return [
      {
        source: "/api/:path*",
        destination: `${destinationBaseUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
