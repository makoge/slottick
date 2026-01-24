import type { MetadataRoute } from "next";
import { locales } from "@/lib/i18n";
import { PrismaClient } from "@prisma/client";

import { KEYWORD_PAGES } from "@/lib/seo/keywords";
import { TARGET_COUNTRIES, TARGET_CATEGORIES } from "@/lib/seo/targets";
import { slugify } from "@/lib/seo/slug";

const prisma = new PrismaClient();

function catSlugFromBusinessCategory(cat: string) {
  return slugify(String(cat ?? ""));
}

function citySlug(city: string) {
  return slugify(String(city ?? ""));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://slottick.com";

  const now = new Date();
  const urls: MetadataRoute.Sitemap = [];

  // ✅ Static pages you want indexed
  const staticPaths = ["", "/explore", "/privacy", "/terms", "/contact"];

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

  // ✅ SEO: Keyword pages (/seo/keyword/[slug])
  for (const locale of locales) {
    for (const p of KEYWORD_PAGES) {
      urls.push({
        url: `${baseUrl}/${locale}/seo/keyword/${p.slug}`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.6
      });
    }
  }

  // ✅ SEO: Country/City/Category pages (/seo/[countrySlug]/[citySlug]/[categorySlug])
  // Assumes TARGET_CATEGORIES items have `.slug` and `.label`
  for (const locale of locales) {
    for (const country of TARGET_COUNTRIES) {
      for (const city of country.cities) {
        const cSlug = slugify(city);
        for (const category of TARGET_CATEGORIES) {
          urls.push({
            url: `${baseUrl}/${locale}/seo/${country.slug}/${cSlug}/${category.slug}`,
            lastModified: now,
            changeFrequency: "monthly",
            priority: 0.65
          });
        }
      }
    }
  }

  // ✅ Optional: Explore landings (/explore/[countrySlug]/[category])
  
  for (const locale of locales) {
    for (const country of TARGET_COUNTRIES) {
      for (const category of TARGET_CATEGORIES) {
        urls.push({
          url: `${baseUrl}/${locale}/explore/${country.slug}/${category.slug}`,
          lastModified: now,
          changeFrequency: "weekly",
          priority: 0.75
        });
      }
    }
  }

  for (const locale of locales) {
    for (const country of TARGET_COUNTRIES) {
      
        urls.push({
          url: `${baseUrl}/${locale}/explore/${country.slug}`,
          lastModified: now,
          changeFrequency: "weekly",
          priority: 0.75
        });
      }
    }
  

  // ✅ Dynamic business URLs from DB (pretty URLs)
  try {
    const businesses = await prisma.business.findMany({
      where: { marketplaceEligibleAt: { not: null } },
      select: {
        slug: true,
        updatedAt: true,
        category: true,
        city: true
      }
    });

    for (const locale of locales) {
      for (const b of businesses) {
        const category = catSlugFromBusinessCategory(b.category);
        const city = citySlug(b.city);

        // Skip broken records instead of generating trash URLs
        if (!b.slug || !category || !city) continue;

        urls.push({
          url: `${baseUrl}/${locale}/${category}/${city}/${b.slug}`,
          lastModified: b.updatedAt ?? now,
          changeFrequency: "weekly",
          priority: 0.9
        });
      }
    }
  } catch {
    // keep static urls if DB fails
  } finally {
    await prisma.$disconnect().catch(() => {});
  }

  return urls;
}
