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

// ✅ Avoid TS "never/label" issues by treating categories safely
function categorySlug(cat: unknown) {
  if (typeof cat === "string") return safeSlug(cat);
  if (cat && typeof cat === "object") {
    const c = cat as Record<string, unknown>;
    const raw = (c.slug ?? c.name ?? c.label) as unknown;
    if (typeof raw === "string") return safeSlug(raw);
  }
  return "";
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://slottick.com";

  const now = new Date();
  const urls: MetadataRoute.Sitemap = [];

  // ✅ Static pages you said exist:
  // app/[locale]/page.tsx
  // app/[locale]/explore/page.tsx
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

  // ✅ Guides pages you listed (folder names = route segment)
  const guideSlugs = [
    "bristol-beauty-salons",
    "bristol-hair-braiders",
    "lash-techs-bristol"
  ];

  for (const locale of locales) {
    for (const g of guideSlugs) {
      urls.push({
        url: `${baseUrl}/${locale}/guides/${g}`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.7
      });
    }
  }

  // ✅ SEO keyword pages:
  // app/[locale]/seo/keyword/[slug]/page.tsx
  for (const locale of locales) {
    for (const p of KEYWORD_PAGES) {
      const slug = safeSlug((p as any).slug);
      if (!slug) continue;

      urls.push({
        url: `${baseUrl}/${locale}/seo/keyword/${slug}`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.6
      });
    }
  }

  // ✅ SEO geo pages:
  // app/[locale]/seo/geo/[categorySlug]/[citySlug]/page.tsx
  for (const locale of locales) {
    for (const country of TARGET_COUNTRIES) {
      for (const city of country.cities) {
        const cSlug = safeSlug(city);
        if (!cSlug) continue;

        for (const cat of TARGET_CATEGORIES as readonly unknown[]) {
          const catSlug = categorySlug(cat);
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

  // ✅ SEO intent pages:
  // app/[locale]/seo/intent/[intent]/[city]/page.tsx
  for (const locale of locales) {
    for (const p of KEYWORD_PAGES) {
      const intent = safeSlug((p as any).intent);
      const city = safeSlug((p as any).city);

      if (!intent || !city) continue;

      urls.push({
        url: `${baseUrl}/${locale}/seo/intent/${intent}/${city}`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.6
      });
    }
  }

  // ✅ Explore country/category landings:
  // app/[locale]/explore/country/[countrySlug]/[category]/page.tsx
  for (const locale of locales) {
    for (const country of TARGET_COUNTRIES) {
      for (const cat of TARGET_CATEGORIES as readonly unknown[]) {
        const catSlug = categorySlug(cat);
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

  // ✅ Dynamic business URLs:
  // app/[locale]/explore/business/[category]/[city]/[slug]/page.tsx
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
          url: `${baseUrl}/${locale}/explore/business/${cat}/${city}/${encodeURIComponent(
            slug
          )}`,
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
