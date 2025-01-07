import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Cấu hình client-side nếu cần thiết
    }
    return config;
  },
};

export default nextConfig;
