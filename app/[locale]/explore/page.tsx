// app/[locale]/explore/page.tsx
import type { Metadata } from "next";
import ExploreClient from "./explore-client";
import { locales } from "@/lib/i18n";
import { prisma } from "@/lib/db";
import { Industry } from "@prisma/client";

export const revalidate = 3600;

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
  const industry = normalize(sp.industry);
  return Boolean(q || city || industry);
}

function toIndustryEnum(input: unknown): Industry | undefined {
  const raw = String(input ?? "").trim();
  if (!raw) return undefined;

  // enum values
  if (Object.values(Industry).includes(raw as Industry)) return raw as Industry;

  // pretty labels (optional)
  const map: Record<string, Industry> = {
    "Beauty & care": Industry.BEAUTY_AND_CARE,
    "Wellness & lifestyle": Industry.WELLNESS_AND_LIFESTYLE,
    "Creative services": Industry.CREATIVE_SERVICES,
    "Home & local": Industry.HOME_AND_LOCAL,
    "Education & professionals": Industry.EDUCATION_AND_PROFESSIONALS
  };

  return map[raw];
}

// Optional: pretty label for dropdown display
function industryLabel(x: Industry) {
  const labels: Record<Industry, string> = {
    BEAUTY_AND_CARE: "Beauty & care",
    WELLNESS_AND_LIFESTYLE: "Wellness & lifestyle",
    CREATIVE_SERVICES: "Creative services",
    HOME_AND_LOCAL: "Home & local",
    EDUCATION_AND_PROFESSIONALS: "Education & professionals"
  };
  return labels[x] ?? String(x);
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

  const title = "Explore services near you";
  const description =
    "Explore and book trusted businesses near you. Search by service name or category, filter by city and industry.";

  const filtered = hasFilters(sp);

  return {
    metadataBase: new URL(baseUrl),
    title: `${title} | ${siteName}`,
    description,
    alternates: { canonical, languages },
    robots: filtered ? { index: false, follow: true } : { index: true, follow: true },
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

  const qRaw = normalize(sp.q);
  const q = qRaw.toLowerCase();
  const city = normalize(sp.city);

  const industryEnum = toIndustryEnum(normalize(sp.industry));

  // ✅ industries list for dropdown (enum values + nice labels)
  const industriesRaw = await prisma.business.findMany({
    select: { industry: true },
    distinct: ["industry"]
  });

  const industries = industriesRaw
    .map((x) => x.industry)
    .filter(Boolean)
    .sort((a, b) => String(a).localeCompare(String(b)));

  const businesses = await prisma.business.findMany({
    take: 500,
    orderBy: { createdAt: "desc" },
    where: {
      ...(city ? { city } : {}),
      ...(industryEnum ? { industry: industryEnum } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { city: { contains: q, mode: "insensitive" } },
              { country: { contains: q, mode: "insensitive" } },
              {
                services: {
                  some: {
                    OR: [
                      { name: { contains: q, mode: "insensitive" } },
                      { category: { contains: q, mode: "insensitive" } }
                    ]
                  }
                }
              }
            ]
          }
        : {})
    },
    select: {
      name: true,
      slug: true,
      city: true,
      country: true,
      industry: true,
      logoUrl: true,
      heroTag: true,
      ratingAvg: true,
      ratingCount: true
    }
  });

  const baseUrl = envBaseUrl();

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
        industries={industries.length ? industries : ["Beauty & care"]}
        initialQ={qRaw}
        initialCity={normalize(sp.city)}
        initialIndustry={(normalize(sp.industry) || "All") as any}
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
