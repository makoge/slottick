import type { NextConfig } from "next";




const isDev = process.env.NODE_ENV === "development";

const csp = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https:;
  style-src 'self' 'unsafe-inline' https:;
  img-src 'self' data: blob: https:;
  font-src 'self' data: https:;
  connect-src 'self' https: wss:;
  media-src 'self' data: blob: https:;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`.replace(/\s{2,}/g, " ").trim();

const nextConfig: NextConfig = {
  reactCompiler: true,
  allowedDevOrigins: ["http://localhost:3000", "http://192.168.8.103:3000"],

  async redirects() {
    return [
      {
        source: "/",
        destination: "/en",
        permanent: true
      },
      {
        source: "/:locale/seo/keyword/:slug",
        destination: "/:locale/services/discover/:slug",
        permanent: true
      }
    ];
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: isDev
              ? csp.replace("upgrade-insecure-requests;", "")
              : csp
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin"
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff"
          },
          {
            key: "X-Frame-Options",
            value: "DENY"
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()"
          }
        ]
      }
    ];
  }
};

export default nextConfig;