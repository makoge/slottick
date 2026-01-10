import type { Metadata } from "next";
import ExploreClient from "../../explore-client";
import { locales } from "@/lib/i18n";

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

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string; countrySlug: CountrySlug; category: CategorySlug }>;
}): Promise<Metadata> {
  const { locale, countrySlug, category } = await params;

  const siteName = "Slottick";
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://slottick.com";

  const country = COUNTRY_LANDINGS.find((x) => x.slug === countrySlug)!;
  const cat = CATEGORY_LANDINGS.find((x) => x.slug === category)!;

  const canonical = `${baseUrl}/${locale}/explore/${countrySlug}/${category}`;
  const languages = Object.fromEntries(
    locales.map((l) => [l, `${baseUrl}/${l}/explore/${countrySlug}/${category}`])
  );

  const title = `${cat.title} in ${country.name} — book trusted businesses`;
  const description = `Find and book ${cat.title.toLowerCase()} in ${country.name}. Browse top-rated businesses, filter by city, and book instantly with real availability.`;

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
      locale,
      images: [{ url: "/og.png", width: 1200, height: 630, alt: siteName }]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og.png"]
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

  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/businesses`, {
    cache: "no-store"
  });
  const data = await res.json();

  const businessesAll = data.businesses ?? [];
  const businesses = businessesAll
    .filter((b: any) => String(b.country).toUpperCase() === country.code)
    .filter((b: any) => String(b.category) === cat.name);

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://slottick.com";

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${cat.title} in ${country.name}`,
    itemListElement: businesses.slice(0, 200).map((b: any, i: number) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${baseUrl}/${locale}/book/${b.slug}`,
      name: b.name
    }))
  };

  // Optional but strong for SEO: breadcrumbs
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Explore",
        item: `${baseUrl}/${locale}/explore`
      },
      {
        "@type": "ListItem",
        position: 2,
        name: country.name,
        item: `${baseUrl}/${locale}/explore/${countrySlug}`
      },
      {
        "@type": "ListItem",
        position: 3,
        name: cat.title,
        item: `${baseUrl}/${locale}/explore/${countrySlug}/${category}`
      }
    ]
  };

  return (
    <>
      <ExploreClient

        businesses={businesses}
        categories={["Lash", "Nails", "Brows", "Barber", "Massage", "Other"] as any}
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
