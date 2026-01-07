
import type { MetadataRoute } from "next";
import { locales } from "@/lib/i18n";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://slottick.com";

  const now = new Date();

  // Static pages you want indexed
  const staticPaths = ["", "/explore", "/book", "/privacy", "/terms", "/contact"];

  const urls: MetadataRoute.Sitemap = [];

  // ✅ Static localized URLs
  for (const locale of locales) {
    for (const path of staticPaths) {
      const isHome = path === "";
      urls.push({
        url: `${baseUrl}/${locale}${path}`,
        lastModified: now,
        changeFrequency: isHome ? "weekly" : "monthly",
        priority: isHome ? 1 : 0.7
      });
    }
  }

  // ✅ Dynamic booking URLs from DB
  try {
    const businesses = await prisma.business.findMany({
      where: {
        marketplaceEligibleAt: { not: null }
      },
      select: {
        slug: true,
        updatedAt: true
      }
    });

    for (const locale of locales) {
      for (const b of businesses) {
        urls.push({
          url: `${baseUrl}/${locale}/book/${b.slug}`,
          lastModified: b.updatedAt,
          changeFrequency: "weekly",
          priority: 0.9
        });
      }
    }
  } catch {
    // If DB is unavailable, keep at least the static URLs.
    // (Better than failing the build/request.)
  } finally {
    // Avoid connection pileups on serverless
    await prisma.$disconnect().catch(() => {});
  }

  return urls;
}

