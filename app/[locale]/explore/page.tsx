// app/[locale]/explore/page.tsx
import type { Metadata } from "next";
import ExploreClient from "./explore-client";
import { locales } from "@/lib/i18n";
import { prisma } from "@/lib/db";

export const revalidate = 0; // always fresh

function envBaseUrl() {
  // For SEO canonical + OG urls, use env only (avoid headers() async issues)
  // Make sure NEXT_PUBLIC_SITE_URL is set in .env.local for dev.
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}

function toPathPart(v: unknown, fallback: string) {
  const s = String(v ?? "").trim().toLowerCase();
  return s ? encodeURIComponent(s) : fallback;
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  const siteName = "Slottick";
  const baseUrl = envBaseUrl();

  const canonical = `${baseUrl}/${locale}/explore`;
  const languages = Object.fromEntries(locales.map((l) => [l, `${baseUrl}/${l}/explore`]));

  const title = "Explore services near you — salons, barbers, nails, lashes, massage";
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

  // ✅ FIX: DB direct, no isPublished field
  // If you want only verified/eligible businesses, filter using fields you actually have.
  const businesses = await prisma.business.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
    select: {
      name: true,
      slug: true,
      city: true,
      category: true
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
      url: `${baseUrl}/${locale}/${toPathPart(b.category, "other")}/${toPathPart(
        b.city,
        "city"
      )}/${encodeURIComponent(String(b.slug ?? ""))}`,
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
        categories={["Lash", "Nails", "Brows", "Barber", "Massage", "Other"] as any}
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
