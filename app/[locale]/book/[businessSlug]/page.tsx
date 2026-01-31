// app/[locale]/book/[businessSlug]/page.tsx
import type { Metadata } from "next";
import BookingClient from "./booking-client";
import { locales } from "@/lib/i18n";
import { prisma } from "@/lib/db";

type Params = { locale: string; businessSlug: string };

function humanizeIndustry(x?: string | null) {
  if (!x) return "Service";
  const clean = String(x).replace(/_/g, " ").toLowerCase();
  return clean.charAt(0).toUpperCase() + clean.slice(1);
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
      industry: true,
      city: true,
      country: true,
      marketplaceEligibleAt: true,
      heroTag: true,
      logoUrl: true,
      galleryImages: true,
      services: {
      select: {
        name: true,
        price: true,
        currency: true
      }
    }
    }
  });

  if (!business || !business.marketplaceEligibleAt) {
    return {
      title: "Booking page",
      robots: { index: false, follow: false },
      alternates: { canonical, languages }
    };
  }

  const cat = humanizeIndustry(business.industry);
  const where = [business.city, business.country].filter(Boolean).join(", ");

  const title = `Book ${business.name} • ${cat}${where ? ` in ${where}` : ""}`;
  const description =
    business.heroTag?.trim() ||
    `Book an appointment with ${business.name}. Choose a service, pick a time, and confirm instantly.`;

  const ogImage =
  (Array.isArray(business.galleryImages) && business.galleryImages[0]?.url) ||
  business.logoUrl ||
  `${baseUrl}/og.png`;

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
      images: [{ url: ogImage }]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage]
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
      industry: true,
      heroTag: true,

      city: true,
      country: true,
      street: true,
      postalCode: true,

      website: true,
      logoUrl: true,
      galleryImages: true,

      marketplaceEligibleAt: true,
      services: {
        select: { name: true, durationMin: true, price: true, currency: true }
      }
    }
  });

  if (!business) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-2xl font-bold">Business not found</h1>
      </main>
    );
  }

  const shouldEmitSchema = !!business.marketplaceEligibleAt;

  let ratingAvg: number | null = null;
  let ratingCount = 0;

  if (shouldEmitSchema) {
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
    shouldEmitSchema
      ? {
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          name: business.name,
          url,
          address: {
            "@type": "PostalAddress",
            streetAddress: business.street ?? undefined,
            postalCode: business.postalCode ?? undefined,
            addressLocality: business.city ?? undefined,
            addressCountry: business.country ?? undefined
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
                itemOffered: { "@type": "Service", name: s.name }
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
      <BookingClient
        locale={locale}
        businessSlug={businessSlug}
        business={{
          name: business.name,
          slug: business.slug,
          industry: business.industry,
          heroTag: business.heroTag,

          city: business.city,
          country: business.country,
          street: business.street,
          postalCode: business.postalCode,

          website: business.website,
          logoUrl: business.logoUrl,
         galleryImages: Array.isArray(business.galleryImages)
  ? business.galleryImages
      .sort((a, b) => a.sort - b.sort)
      .map((img) => img.url): [],

        }}
      />

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
