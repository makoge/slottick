// app/[locale]/explore/page.tsx
import type { Metadata } from "next";
import ExploreClient from "./explore-client";
import { locales } from "@/lib/i18n";
import { prisma } from "@/lib/db";

export const revalidate = 3600; // opinion: directory pages should cache

function envBaseUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}

function normalize(s: unknown) {
  return String(s ?? "").trim();
}

function ogLocale(locale: string) {
  const map: Record<string, string> = { en: "en_US", et: "et_EE" };
  return map[locale] ?? undefined;
}

function hasFilters(sp: Record<string, string | string[] | undefined>) {
  const q = normalize(sp.q);
  const city = normalize(sp.city);
  const category = normalize(sp.category);
  return Boolean(q || city || category);
}

export async function generateMetadata({
  params,
  searchParams
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const { locale } = await params;
  const sp = await searchParams;

  const siteName = "Slottick";
  const baseUrl = envBaseUrl();
  const canonical = `${baseUrl}/${locale}/explore`;
  const languages = Object.fromEntries(locales.map((l) => [l, `${baseUrl}/${l}/explore`]));

  const title = "Explore services near you — salons, barbers, nails, lashes, massage";
  const description =
    "Explore and book trusted service businesses near you. Find salons, barbers, nails, lashes, brows, massage and more — filter by city and category.";

  // SEO hygiene: avoid duplicate indexing of endless param combinations
  const filtered = hasFilters(sp);

  return {
    metadataBase: new URL(baseUrl),
    title: `${title} | ${siteName}`,
    description,
    alternates: { canonical, languages },
    robots: filtered
      ? { index: false, follow: true } // opinion: noindex filtered query-URLs
      : { index: true, follow: true },
    openGraph: {
      type: "website",
      url: canonical,
      siteName,
      title,
      description,
      locale: ogLocale(locale),
      images: [{ url: `${baseUrl}/og.png`, width: 1200, height: 630, alt: siteName }]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${baseUrl}/og.png`]
    }
  };
}

export default async function Page({
  params,
  searchParams
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const sp = await searchParams;

  const q = normalize(sp.q).toLowerCase();
  const city = normalize(sp.city);
  const category = normalize(sp.category);

  // categories from DB (better than hardcoding)
  const categoriesRaw = await prisma.business.findMany({
    select: { category: true },
    where: { category: { not: "" } },
    distinct: ["category"]
  });
  const categories = categoriesRaw
    .map((x) => String(x.category || "").trim())
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));

  // SSR filtering so the HTML is meaningful even without JS
  const businesses = await prisma.business.findMany({
    take: 500,
    orderBy: { createdAt: "desc" },
    where: {
      ...(city ? { city } : {}),
      ...(category && category.toLowerCase() !== "all" ? { category } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { city: { contains: q, mode: "insensitive" } },
              { category: { contains: q, mode: "insensitive" } },
              { country: { contains: q, mode: "insensitive" } }
            ]
          }
        : {})
    },
    select: {
      name: true,
      slug: true,
      city: true,
      country: true,
      category: true,
      logoUrl: true,
      heroTag: true,
      ratingAvg: true,
      ratingCount: true
    }
  });

  const baseUrl = envBaseUrl();

  // ✅ FIX: URLs MUST match the actual destination you link to
  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Service businesses directory",
    itemListElement: businesses.slice(0, 200).map((b, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${baseUrl}/${locale}/book/${encodeURIComponent(String(b.slug ?? ""))}`,
      name: String(b.name ?? "")
    }))
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${baseUrl}/${locale}` },
      { "@type": "ListItem", position: 2, name: "Explore", item: `${baseUrl}/${locale}/explore` }
    ]
  };

  return (
    <>
      <ExploreClient
        businesses={businesses as any}
        categories={(categories.length ? categories : ["Other"]) as any}
        initialQ={normalize(sp.q)}
        initialCity={normalize(sp.city)}
        initialCategory={(normalize(sp.category) || "All") as any}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
    </>
  );
}
