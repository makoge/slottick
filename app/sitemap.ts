
// app/sitemap.ts
import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";

import { locales } from "@/lib/i18n";
import { KEYWORD_PAGES } from "@/lib/seo/keywords";
import { TARGET_COUNTRIES, TARGET_CATEGORIES } from "@/lib/seo/targets";
import { slugify } from "@/lib/seo/slug";
import { SEO_CITIES_20, SEO_INTENTS_10 } from "@/lib/seo/near-me-targets";
import { getAllBlogPosts } from "@/lib/blog/route";
import { LANDING_PAGES } from "@/lib/landing/pages";

// My opinion: only index locales that are truly translated.
const INDEX_LOCALES = ["en", "fr"] as const;

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

  const staticPaths = ["", "/explore", "/privacy", "/terms", "/contact"];

  // ✅ Blog: /[locale]/blog + /[locale]/blog/[slug]
  const blogPosts = getAllBlogPosts();
  for (const locale of useLocales) {
    urls.push({
      url: `${site}/${locale}/blog`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7
    });

    for (const post of blogPosts) {
      const last = post.updatedAt ? new Date(post.updatedAt) : new Date(post.publishedAt);
      urls.push({
        url: `${site}/${locale}/blog/${post.slug}`,
        lastModified: isNaN(last.getTime()) ? now : last,
        changeFrequency: "monthly",
        priority: 0.65
      });
    }
  }

  // ✅ Landing pages: /[locale]/landing + /[locale]/landing/[slug]
  for (const locale of useLocales) {
    urls.push({
      url: `${site}/${locale}/landing`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.55
    });

    for (const page of LANDING_PAGES) {
      urls.push({
        url: `${site}/${locale}/landing/${page.slug}`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.5
      });
    }
  }

  // ✅ Static pages
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

  // ✅ Guides: /[locale]/guides/[locationSlug]/[serviceSlug]
  for (const locale of useLocales) {
    for (const loc of SEO_CITIES_20) {
      for (const svc of TARGET_CATEGORIES) {
        urls.push({
          url: `${site}/${locale}/guides/${loc.slug}/${svc.slug}`,
          lastModified: now,
          changeFrequency: "monthly",
          priority: 0.65
        });
      }
    }
  }

  // ✅ Keyword discovery pages: /[locale]/services/discover/[slug]
  for (const locale of useLocales) {
    for (const p of KEYWORD_PAGES) {
      const slug = safeSlug((p as any).slug);
      if (!slug) continue;

      urls.push({
        url: `${site}/${locale}/services/discover/${slug}`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.6
      });
    }
  }

  // ✅ Geo pages: /[locale]/services/[countrySlug]/[citySlug]/[categorySlug]
  for (const locale of useLocales) {
    for (const country of TARGET_COUNTRIES) {
      for (const city of country.cities) {
        const citySlug = safeSlug(city);
        if (!citySlug) continue;

        for (const cat of TARGET_CATEGORIES) {
          const categorySlug = safeSlug(cat.slug);
          if (!categorySlug) continue;

          urls.push({
            url: `${site}/${locale}/services/${country.slug}/${citySlug}/${categorySlug}`,
            lastModified: now,
            changeFrequency: "monthly",
            priority: 0.65
          });
        }
      }
    }
  }

  // ✅ Intent pages: /[locale]/services/[intent]/[city]
  for (const locale of useLocales) {
    for (const intent of SEO_INTENTS_10) {
      for (const city of SEO_CITIES_20) {
        urls.push({
          url: `${site}/${locale}/services/${intent.slug}/${city.slug}`,
          lastModified: now,
          changeFrequency: "monthly",
          priority: 0.6
        });
      }
    }
  }

  // ✅ Explore country/category landings
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

  // ✅ Booking pages: /[locale]/book/[slug]
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

  const unique = new Map<string, MetadataRoute.Sitemap[number]>();
  for (const u of urls) unique.set(u.url, u);
  return Array.from(unique.values());
}