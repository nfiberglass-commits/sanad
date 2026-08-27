import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The floating Next.js dev badge is a development tool, not part of Sanad.
  devIndicators: false,
  serverExternalPackages: ["@prisma/client", "prisma"],
};

export default nextConfig;
