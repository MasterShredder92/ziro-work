import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.1.154"],
  webpack(config) {
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      "@data": path.resolve(__dirname, "lib/data"),
      "@ziro": path.resolve(__dirname, "src/lib/ziro"),
    };
    return config;
  },
};

export default nextConfig;
