import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://slottick.com";

  return {
    rules: [
      {
        userAgent: "*",

        // ❌ private / non-SEO areas
        disallow: [
          "/api/",
          "/*/login",
          "/*/register",
          "/*/dashboard",
          "/*/billing",
          "/*/customer",
          "/*/stripe",

          // ❌ avoid crawling infinite filter junk
          "/*?*"
        ],

        // ✅ allow core assets
        allow: [
          "/",
          "/_next/",
          "/manifest.webmanifest",
          "/favicon.ico",
          "/og.png"
        ]
      }
    ],
    sitemap: `${baseUrl}/sitemap.xml`
  };
}
