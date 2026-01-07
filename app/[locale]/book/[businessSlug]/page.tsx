// app/[locale]/book/[businessSlug]/page.tsx
import type { Metadata } from "next";
import BookingClient from "./booking-client";
import { locales } from "@/lib/i18n";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type Params = { locale: string; businessSlug: string };

function titleCaseCategory(x?: string | null) {
  if (!x) return "service";
  return x.charAt(0).toUpperCase() + x.slice(1);
}

export async function generateMetadata({
  params
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { locale, businessSlug } = await params;

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://slottick.com";

  const canonical = `${baseUrl}/${locale}/book/${businessSlug}`;
  const languages = Object.fromEntries(
    locales.map((l) => [l, `${baseUrl}/${l}/book/${businessSlug}`])
  );

  const business = await prisma.business.findUnique({
    where: { slug: businessSlug },
    select: {
      name: true,
      category: true,
      city: true,
      country: true,
      marketplaceEligibleAt: true
    }
  });

  if (!business || !business.marketplaceEligibleAt) {
    return {
      title: "Booking page",
      robots: { index: false, follow: false },
      alternates: { canonical, languages }
    };
  }

  const cat = titleCaseCategory(business.category);

  const title = `Book ${business.name} • ${cat} in ${business.city}`;
  const description = `Book an appointment with ${business.name} in ${business.city}. Choose a ${cat.toLowerCase()} service, pick a time, and confirm instantly.`;

  return {
    title,
    description,
    alternates: { canonical, languages },
    openGraph: {
      type: "website",
      url: canonical,
      title,
      description,
      locale,
      images: [{ url: "/og.png", width: 1200, height: 630, alt: "Slottick" }]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og.png"]
    }
  };
}

export default async function Page({ params }: { params: Promise<Params> }) {
  const { locale, businessSlug } = await params;

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://slottick.com";

  const business = await prisma.business.findUnique({
    where: { slug: businessSlug },
    select: {
      id: true,
      name: true,
      slug: true,
      category: true,
      city: true,
      country: true,
      website: true,
      marketplaceEligibleAt: true,
      updatedAt: true,
      services: {
        select: { name: true, durationMin: true, price: true, currency: true }
      }
    }
  });

  // If not public-ready, still render UI (up to you) but don't emit rich schema.
  const shouldEmitSchema = !!business?.marketplaceEligibleAt;

  let ratingAvg: number | null = null;
  let ratingCount = 0;

  if (shouldEmitSchema && business?.id) {
    const agg = await prisma.review.aggregate({
      where: { businessId: business.id },
      _avg: { rating: true },
      _count: { rating: true }
    });
    ratingAvg = agg._avg.rating ?? null;
    ratingCount = agg._count.rating ?? 0;
  }

  const url = `${baseUrl}/${locale}/book/${businessSlug}`;

  const localBusinessJsonLd =
    shouldEmitSchema && business
      ? {
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          name: business.name,
          url,
          areaServed: business.city,
          address: {
            "@type": "PostalAddress",
            addressLocality: business.city,
            addressCountry: business.country
          },
          sameAs: business.website ? [business.website] : undefined,
          aggregateRating:
            ratingCount > 0 && ratingAvg
              ? {
                  "@type": "AggregateRating",
                  ratingValue: Number(ratingAvg.toFixed(2)),
                  reviewCount: ratingCount
                }
              : undefined,
          makesOffer: business.services?.length
            ? business.services.map((s) => ({
                "@type": "Offer",
                price: s.price,
                priceCurrency: s.currency,
                itemOffered: {
                  "@type": "Service",
                  name: s.name
                }
              }))
            : undefined
        }
      : null;

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${baseUrl}/${locale}` },
      { "@type": "ListItem", position: 2, name: "Booking", item: url }
    ]
  };

  return (
    <>
      <BookingClient locale={locale} businessSlug={businessSlug} />

      {localBusinessJsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
        />
      ) : null}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
    </>
  );
}

