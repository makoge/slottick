import type { Metadata } from "next";
import ExploreClient from "../explore-client";
import { locales } from "@/lib/i18n";

const COUNTRY_LANDINGS = [
  { slug: "england", code: "GB", name: "England" },
  { slug: "united-states", code: "US", name: "United States" },
  { slug: "germany", code: "DE", name: "Germany" }
] as const;

type CountrySlug = (typeof COUNTRY_LANDINGS)[number]["slug"];

export async function generateStaticParams() {
  const all: { locale: string; countrySlug: CountrySlug }[] = [];
  for (const locale of locales) {
    for (const c of COUNTRY_LANDINGS) {
      all.push({ locale, countrySlug: c.slug });
    }
  }
  return all;
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string; countrySlug: CountrySlug }>;
}): Promise<Metadata> {
  const { locale, countrySlug } = await params;

  const siteName = "Slottick";
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://slottick.com";

  const c = COUNTRY_LANDINGS.find((x) => x.slug === countrySlug)!;

  const canonical = `${baseUrl}/${locale}/explore/${countrySlug}`;
  const languages = Object.fromEntries(
    locales.map((l) => [l, `${baseUrl}/${l}/explore/${countrySlug}`])
  );

  const title = `Book services in ${c.name} — salons, barbers, nails, lashes, massage`;
  const description = `Explore and book trusted service businesses in ${c.name}. Find salons, barbers,tattoo, nail studios, lash & brow services, massage and more — filter by city and category.`;

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
  params: Promise<{ locale: string; countrySlug: CountrySlug }>;
}) {
  const { locale, countrySlug } = await params;

  const c = COUNTRY_LANDINGS.find((x) => x.slug === countrySlug)!;

  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/businesses`, {
    cache: "no-store"
  });
  const data = await res.json();
  const businesses = (data.businesses ?? []).filter((b: any) => String(b.country).toUpperCase() === c.code);

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://slottick.com";

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Service businesses in ${c.name}`,
    itemListElement: businesses.slice(0, 200).map((b: any, i: number) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${baseUrl}/${locale}/book/${b.slug}`,
      name: b.name
    }))
  };

  return (
    <>
      <ExploreClient
        locale={locale}
        businesses={businesses}
        categories={["Lash", "Nails", "Brows", "Barber", "Massage", "Other"] as any}
        heading={`Book services in ${c.name}`}
        intro={`Find salons, barbers, nail studios, lash & brow services, massage and more in ${c.name}.`}
        defaultCity="" // All cities
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
    </>
  );
}
