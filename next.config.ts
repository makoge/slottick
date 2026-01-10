import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  allowedDevOrigins: [
    "http://localhost:3000",
    "http://192.168.8.103:3000",
  ],
};

export default nextConfig;

