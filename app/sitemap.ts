// app/sitemap.ts
import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";

import { locales } from "@/lib/i18n";
import { KEYWORD_PAGES } from "@/lib/seo/keywords";
import { TARGET_COUNTRIES, TARGET_CATEGORIES } from "@/lib/seo/targets";
import { slugify } from "@/lib/seo/slug";
import { SEO_CITIES_20, SEO_INTENTS_10 } from "@/lib/seo/near-me-targets";

// My opinion: don’t ship french URLs until pages are truly translated
const INDEX_LOCALES = ["en"] as const;

function baseUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://slottick.com").replace(/\/$/, "");
}

function safeSlug(v: unknown) {
  const s = String(v ?? "").trim();
  return s ? slugify(s) : "";
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = baseUrl();
  const now = new Date();

  const urls: MetadataRoute.Sitemap = [];

  const useLocales = locales.filter((l) =>
    (INDEX_LOCALES as readonly string[]).includes(l)
  );

  // Static pages
  const staticPaths = ["", "/explore", "/privacy", "/terms", "/contact"];
  for (const locale of useLocales) {
    for (const path of staticPaths) {
      const isHome = path === "";
      urls.push({
        url: `${site}/${locale}${path}`,
        lastModified: now,
        changeFrequency: isHome ? "weekly" : "monthly",
        priority: isHome ? 1 : 0.7
      });
    }
  }

  // Guides (only if these routes exist)
  const guideSlugs = ["bristol-beauty-salons", "bristol-hair-braiders", "lash-techs-bristol"];
  for (const locale of useLocales) {
    for (const g of guideSlugs) {
      urls.push({
        url: `${site}/${locale}/guides/${g}`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.7
      });
    }
  }

  // Keyword pages: /[locale]/seo/keyword/[slug]
  for (const locale of useLocales) {
    for (const p of KEYWORD_PAGES) {
      const slug = safeSlug((p as any).slug);
      if (!slug) continue;

      urls.push({
        url: `${site}/${locale}/seo/keyword/${slug}`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.6
      });
    }
  }

  // Geo pages (your earlier file): /[locale]/seo/[countrySlug]/[citySlug]/[categorySlug]
  for (const locale of useLocales) {
    for (const country of TARGET_COUNTRIES) {
      for (const city of country.cities) {
        const citySlug = safeSlug(city);
        if (!citySlug) continue;

        for (const cat of TARGET_CATEGORIES) {
          const categorySlug = safeSlug(cat.slug);
          if (!categorySlug) continue;

          urls.push({
            url: `${site}/${locale}/seo/${country.slug}/${citySlug}/${categorySlug}`,
            lastModified: now,
            changeFrequency: "monthly",
            priority: 0.65
          });
        }
      }
    }
  }

  // Intent pages (your file): /[locale]/seo/[intent]/[city]
  for (const locale of useLocales) {
    for (const intent of SEO_INTENTS_10) {
      for (const city of SEO_CITIES_20) {
        urls.push({
          url: `${site}/${locale}/seo/${intent.slug}/${city.slug}`,
          lastModified: now,
          changeFrequency: "monthly",
          priority: 0.6
        });
      }
    }
  }

  // Explore country/category landings (only if this route exists in your app):
  // /[locale]/explore/country/[countrySlug]/[categorySlug]
  for (const locale of useLocales) {
    for (const country of TARGET_COUNTRIES) {
      for (const cat of TARGET_CATEGORIES) {
        const categorySlug = safeSlug(cat.slug);
        if (!categorySlug) continue;

        urls.push({
          url: `${site}/${locale}/explore/country/${country.slug}/${categorySlug}`,
          lastModified: now,
          changeFrequency: "weekly",
          priority: 0.78
        });
      }
    }
  }

  // Dynamic business URLs (only include if you actually have that route):
  // You previously showed booking route: /[locale]/book/[slug]
  // This sitemap currently uses /explore/business/... which might not exist.
  // My opinion: sitemap should include the REAL booking pages.
  try {
    const businesses = await prisma.business.findMany({
      where: { marketplaceEligibleAt: { not: null } },
      select: { slug: true, updatedAt: true }
    });

    for (const locale of useLocales) {
      for (const b of businesses) {
        const slug = String(b.slug ?? "").trim();
        if (!slug) continue;

        urls.push({
          url: `${site}/${locale}/book/${encodeURIComponent(slug)}`,
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
