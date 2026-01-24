// app/sitemap.ts
import type { MetadataRoute } from "next";
import { locales } from "@/lib/i18n";
import { prisma } from "@/lib/db";

import { KEYWORD_PAGES } from "@/lib/seo/keywords";
import { TARGET_COUNTRIES, TARGET_CATEGORIES } from "@/lib/seo/targets";
import { slugify } from "@/lib/seo/slug";

function safeSlug(v: unknown) {
  const s = String(v ?? "").trim();
  return s ? slugify(s) : "";
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://slottick.com";

  const now = new Date();
  const urls: MetadataRoute.Sitemap = [];

  // ✅ Static pages
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

  // ✅ SEO GEO pages: /seo/geo/[categorySlug]/[city]
  for (const locale of locales) {
    for (const country of TARGET_COUNTRIES) {
      for (const city of country.cities) {
        const cSlug = safeSlug(city);
        if (!cSlug) continue;

        for (const cat of TARGET_CATEGORIES) {
          const catSlug = safeSlug(cat.slug ?? cat.label ?? "");
          if (!catSlug) continue;

          urls.push({
            url: `${baseUrl}/${locale}/seo/geo/${catSlug}/${cSlug}`,
            lastModified: now,
            changeFrequency: "monthly",
            priority: 0.65
          });
        }
      }
    }
  }

  // ✅ SEO INTENT pages: /seo/intent/[intent]/[city]
  // Supports either { intent, city } or fallback to { slug } if that’s what you stored.
  for (const locale of locales) {
    for (const p of KEYWORD_PAGES as any[]) {
      const intent = safeSlug(p.intent ?? "");
      const city = safeSlug(p.city ?? "");
      const fallback = safeSlug(p.slug ?? "");

      if (intent && city) {
        urls.push({
          url: `${baseUrl}/${locale}/seo/intent/${intent}/${city}`,
          lastModified: now,
          changeFrequency: "monthly",
          priority: 0.6
        });
      } else if (fallback) {
        urls.push({
          url: `${baseUrl}/${locale}/seo/intent/${fallback}`,
          lastModified: now,
          changeFrequency: "monthly",
          priority: 0.55
        });
      }
    }
  }

  // ✅ Explore country landings:
  // /explore/country/[countrySlug]
  // /explore/country/[countrySlug]/[category]
  for (const locale of locales) {
    for (const country of TARGET_COUNTRIES) {
      urls.push({
        url: `${baseUrl}/${locale}/explore/country/${country.slug}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.75
      });

      for (const category of TARGET_CATEGORIES) {
        const catSlug = safeSlug(category.slug ?? category.label ?? "");
        if (!catSlug) continue;

        urls.push({
          url: `${baseUrl}/${locale}/explore/country/${country.slug}/${catSlug}`,
          lastModified: now,
          changeFrequency: "weekly",
          priority: 0.78
        });
      }
    }
  }

  // ✅ Dynamic business URLs (match folder: /explore/business/[category]/[city]/[slug])
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
        const cat = safeSlug(b.category);
        const city = safeSlug(b.city);
        const slug = String(b.slug ?? "").trim();

        if (!cat || !city || !slug) continue;

        urls.push({
          url: `${baseUrl}/${locale}/explore/business/${cat}/${city}/${encodeURIComponent(slug)}`,
          lastModified: b.updatedAt ?? now,
          changeFrequency: "weekly",
          priority: 0.9
        });
      }
    }
  } catch {
    // keep sitemap working even if DB fails
  }

  return urls;
}
