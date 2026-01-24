import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  allowedDevOrigins: ["http://localhost:3000", "http://192.168.8.103:3000"],

  async redirects() {
    return [
      {
        source: "/",
        destination: "/en",
        permanent: true
      }
    ];
  }
};

export default nextConfig;
