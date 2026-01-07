// app/[locale]/explore/page.tsx
import type { Metadata } from "next";
import ExploreClient from "./explore-client";
import { locales } from "@/lib/i18n";

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  const siteName = "Slottick";
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://slottick.com";

  const canonical = `${baseUrl}/${locale}/explore`;
  const languages = Object.fromEntries(
    locales.map((l) => [l, `${baseUrl}/${l}/explore`])
  );

  const title =
    "Explore services near you — salons, barbers, nails, lashes, massage";
  const description =
    "Explore and book trusted service businesses near you. Find salons, barbers, nails, lashes, brows, massage and more — filter by city and category.";

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
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/businesses`,
    { cache: "no-store" }
  );

  const data = await res.json();
  const businesses = data.businesses ?? [];

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://slottick.com";

  // ✅ Structured data: ItemList of businesses (good for directory-style pages)
  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Service businesses directory",
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
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
    </>
  );
}
