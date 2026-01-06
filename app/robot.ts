
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://slottick.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/"],
        disallow: [
          "/api/",
          "/*/login",
          "/*/register",
          "/*/dashboard",
          "/*/billing",
          "/*/customer",
          "/*/stripe"
        ]
      }
    ],
    sitemap: `${baseUrl}/sitemap.xml`
  };
}
