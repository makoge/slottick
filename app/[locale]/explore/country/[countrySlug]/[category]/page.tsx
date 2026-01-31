import type { Metadata } from "next";
import ExploreClient from "../../../explore-client";
import { locales } from "@/lib/i18n";
import { prisma } from "@/lib/db";
import { Industry } from "@prisma/client";

const COUNTRY_LANDINGS = [
  { slug: "england", code: "GB", name: "England" },
  { slug: "united-states", code: "US", name: "United States" },
  { slug: "germany", code: "DE", name: "Germany" }
] as const;

const CATEGORY_LANDINGS = [
  { slug: "lash", name: "Lash", title: "Lash extensions" },
  { slug: "nails", name: "Nails", title: "Nail salons" },
  { slug: "brows", name: "Brows", title: "Brow services" },
  { slug: "barber", name: "Barber", title: "Barbers" },
  { slug: "massage", name: "Massage", title: "Massage" },
  { slug: "other", name: "Other", title: "Beauty & wellness services" }
] as const;

type CountrySlug = (typeof COUNTRY_LANDINGS)[number]["slug"];
type CategorySlug = (typeof CATEGORY_LANDINGS)[number]["slug"];

export async function generateStaticParams() {
  const all: { locale: string; countrySlug: CountrySlug; category: CategorySlug }[] = [];
  for (const locale of locales) {
    for (const c of COUNTRY_LANDINGS) {
      for (const k of CATEGORY_LANDINGS) {
        all.push({ locale, countrySlug: c.slug, category: k.slug });
      }
    }
  }
  return all;
}

function envBaseUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://slottick.com").replace(/\/$/, "");
}

function ogLocale(locale: string) {
  const map: Record<string, string> = { en: "en_US", et: "et_EE" };
  return map[locale] ?? undefined;
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string; countrySlug: CountrySlug; category: CategorySlug }>;
}): Promise<Metadata> {
  const { locale, countrySlug, category } = await params;

  const siteName = "Slottick";
  const baseUrl = envBaseUrl();

  const country = COUNTRY_LANDINGS.find((x) => x.slug === countrySlug)!;
  const cat = CATEGORY_LANDINGS.find((x) => x.slug === category)!;

  const canonical = `${baseUrl}/${locale}/explore/country/${countrySlug}/${category}`;
  const languages = Object.fromEntries(
    locales.map((l) => [l, `${baseUrl}/${l}/explore/country/${countrySlug}/${category}`])
  );

  const title = `${cat.title} in ${country.name} — book trusted businesses`;
  const description = `Find and book ${cat.title.toLowerCase()} in ${country.name}. Browse top-rated businesses and book instantly with real availability.`;

  return {
    metadataBase: new URL(baseUrl),
    title: `${title} | ${siteName}`,
    description,
    alternates: { canonical, languages },
    robots: { index: true, follow: true },
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
  params
}: {
  params: Promise<{ locale: string; countrySlug: CountrySlug; category: CategorySlug }>;
}) {
  const { locale, countrySlug, category } = await params;

  const country = COUNTRY_LANDINGS.find((x) => x.slug === countrySlug)!;
  const cat = CATEGORY_LANDINGS.find((x) => x.slug === category)!;

  // ✅ Fetch businesses by SERVICE CATEGORY (better SEO relevance)
  const businesses = await prisma.business.findMany({
    take: 500,
    orderBy: { ratingAvg: "desc" },
    where: {
      country: country.code,
      services: {
        some: {
          category: cat.name // ✅ Service.category (e.g. "Massage")
        }
      }
    },
    select: {
      name: true,
      slug: true,
      industry: true,
      city: true,
      country: true,
      ratingAvg: true,
      ratingCount: true,
      heroTag: true,
      logoUrl: true
    }
  });

  // ✅ Industries dropdown (enum values as strings)
  const industriesRaw = await prisma.business.findMany({
    select: { industry: true },
    distinct: ["industry"]
  });

  const industries = industriesRaw
    .map((x) => x.industry)
    .filter(Boolean)
    .sort((a, b) => String(a).localeCompare(String(b)))
    .map((x) => String(x)); // ✅ enum -> string

  const baseUrl = envBaseUrl();

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${cat.title} in ${country.name}`,
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
      { "@type": "ListItem", position: 1, name: "Explore", item: `${baseUrl}/${locale}/explore` },
      {
        "@type": "ListItem",
        position: 2,
        name: country.name,
        item: `${baseUrl}/${locale}/explore/country/${countrySlug}`
      },
      {
        "@type": "ListItem",
        position: 3,
        name: cat.title,
        item: `${baseUrl}/${locale}/explore/country/${countrySlug}/${category}`
      }
    ]
  };

  return (
    <>
      <ExploreClient
        businesses={businesses as any}
        industries={industries.length ? (industries as any) : (["BEAUTY_AND_CARE"] as any)}
        heading={`${cat.title} in ${country.name}`}
        intro={`Browse ${cat.title.toLowerCase()} in ${country.name}, filter by city, and book instantly.`}
        defaultCity=""
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
