import type { NextConfig } from "next";
import nextPWA from "next-pwa";

const withPWA = nextPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development" // 👈 important
});

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

export default withPWA(nextConfig);

