import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,

  allowedDevOrigins: [
    "http://localhost:3000",
    "http://192.168.8.103:3000",
  ],

  async redirects() {
    return [
      // ✅ www -> non-www (fixes Google choosing www as canonical)
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.slottick.com" }],
        destination: "https://slottick.com/:path*",
        permanent: true,
      },

      // ✅ root -> /en (your real homepage)
      {
        source: "/",
        destination: "/en",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
