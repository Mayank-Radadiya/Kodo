import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true, // Ignores type errors during build
  },
  eslint: {
    ignoreDuringBuilds: true, // Ignores ESLint errors
  },
};

export default nextConfig;
