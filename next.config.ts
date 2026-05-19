import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Turbopack alias resolution (Next.js 16+ default bundler)
  turbopack: {
    resolveAlias: {
      "@data": "./lib/data",
      "@ziro": "./src/lib/ziro",
    },
  },
  // Webpack alias resolution (fallback for --webpack flag or older builds)
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
