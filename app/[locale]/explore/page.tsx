import type { Metadata } from "next";
import ExploreClient from "./explore-client";
import { locales } from "@/lib/i18n";
import { prisma } from "@/lib/db";
import { Industry, ServiceCategory, BookingStatus } from "@prisma/client";
import { getDictionary } from "@/lib/dictionaries";

export const revalidate = 3600;

function envBaseUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}

function normalize(s: unknown) {
  return String(s ?? "").trim();
}

function ogLocale(locale: string) {
  const map: Record<string, string> = { en: "en_US", fr: "fr_FR", et: "et_EE" };
  return map[locale] ?? undefined;
}

function hasFilters(sp: Record<string, string | string[] | undefined>) {
  const q = normalize(sp.q);
  const city = normalize(sp.city);
  const industry = normalize(sp.industry);
  return Boolean(q || city || industry);
}

/** URL/label -> Industry enum (accept enum keys + old EN/FR labels) */
function toIndustryEnum(input: unknown): Industry | undefined {
  const raw = String(input ?? "").trim();
  if (!raw) return undefined;

  if (Object.values(Industry).includes(raw as Industry)) return raw as Industry;

  const map: Record<string, Industry> = {
    // EN
    "Beauty & care": Industry.BEAUTY_AND_CARE,
    "Wellness & lifestyle": Industry.WELLNESS_AND_LIFESTYLE,
    "Creative services": Industry.CREATIVE_SERVICES,
    "Home & local": Industry.HOME_AND_LOCAL,
    "Education & professionals": Industry.EDUCATION_AND_PROFESSIONALS,

    // FR
    "Beauté & soins": Industry.BEAUTY_AND_CARE,
    "Bien-être & lifestyle": Industry.WELLNESS_AND_LIFESTYLE,
    "Services créatifs": Industry.CREATIVE_SERVICES,
    "Maison & local": Industry.HOME_AND_LOCAL,
    "Éducation & professionnels": Industry.EDUCATION_AND_PROFESSIONALS,
    "Education & professionnels": Industry.EDUCATION_AND_PROFESSIONALS
  };

  return map[raw];
}

/** Try to interpret search text as a ServiceCategory enum */
function toServiceCategoryFromQuery(q: string): ServiceCategory | undefined {
  const s = q.trim().toLowerCase();
  if (!s) return undefined;

  const map: Record<string, ServiceCategory> = {
    lash: ServiceCategory.LASH,
    lashes: ServiceCategory.LASH,

    nail: ServiceCategory.NAILS,
    nails: ServiceCategory.NAILS,
    manicure: ServiceCategory.NAILS,
    pedicure: ServiceCategory.NAILS,

    brow: ServiceCategory.BROWS,
    brows: ServiceCategory.BROWS,
    eyebrow: ServiceCategory.BROWS,
    eyebrows: ServiceCategory.BROWS,

    hair: ServiceCategory.HAIR,
    haircut: ServiceCategory.HAIR,
    hairstylist: ServiceCategory.HAIR,

    barber: ServiceCategory.BARBER,
    barbers: ServiceCategory.BARBER,

    massage: ServiceCategory.MASSAGE,

    makeup: ServiceCategory.MAKEUP,
    skincare: ServiceCategory.SKINCARE,
    tattoo: ServiceCategory.TATTOO,
    fitness: ServiceCategory.FITNESS,

    other: ServiceCategory.OTHER
  };

  if (map[s]) return map[s];
  const hit = Object.keys(map).find((k) => s.includes(k));
  return hit ? map[hit] : undefined;
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

  const title = locale === "fr" ? "Explorer des services près de vous" : "Explore services near you";
  const description =
    locale === "fr"
      ? "Explorez et réservez des entreprises fiables près de chez vous. Recherchez un service, filtrez par ville et secteur."
      : "Explore and book trusted businesses near you. Search by service and filter by city and industry.";

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

  const dict = await getDictionary(locale);

  const qRaw = normalize(sp.q);
  const qLower = qRaw.toLowerCase();
  const city = normalize(sp.city);

  const industryEnum = toIndustryEnum(normalize(sp.industry));
  const serviceCategoryFromQ = toServiceCategoryFromQuery(qLower);

  const industriesRaw = await prisma.business.findMany({
    where: {
      services: { some: {} }
    },
    select: { industry: true },
    distinct: ["industry"]
  });

  const industries = industriesRaw
    .map((x) => x.industry)
    .filter((x): x is Industry => Boolean(x))
    .sort((a, b) => String(a).localeCompare(String(b)));

  const baseUrl = envBaseUrl();

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const now = new Date();
  const next14Days = new Date();
  next14Days.setDate(next14Days.getDate() + 14);

  const businesses = await prisma.business.findMany({
    take: 500,
    orderBy: { createdAt: "desc" },
    where: {
      services: {
        some: {}
      },
      ...(city ? { city } : {}),
      ...(industryEnum ? { industry: industryEnum } : {}),
      ...(qLower
        ? {
            OR: [
              { name: { contains: qLower, mode: "insensitive" } },
              { city: { contains: qLower, mode: "insensitive" } },
              { country: { contains: qLower, mode: "insensitive" } },
              {
                services: {
                  some: {
                    OR: [
                      { name: { contains: qLower, mode: "insensitive" } },
                      ...(serviceCategoryFromQ ? [{ category: { equals: serviceCategoryFromQ } }] : [])
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
      ratingCount: true,

      galleryImages: {
    orderBy: { sort: "asc" },
    take: 1,
    select: {
      url: true
    }
  },

      services: {
        select: {
          id: true,
          name: true,
          price: true,
          currency: true,
          category: true,
          durationMin: true
        }
      },

      // For trending / market insight card
      bookings: {
        where: {
          createdAt: { gte: thirtyDaysAgo },
          status: { in: [BookingStatus.CONFIRMED, BookingStatus.DONE] }
        },
        select: {
          id: true,
          startsAt: true,
          durationMin: true
        }
      },

      // For future next-slot logic
      availabilityRule: {
        select: {
          timezone: true,
          daysJson: true,
          start: true,
          end: true,
          breakStart: true,
          breakEnd: true,
          bufferMin: true,
          slotStepMin: true
        }
      },

      // Upcoming occupied times
      // named differently to avoid collision would require client change,
      // so we keep one bookings field for now and client can still use it
      // for trending count. If you later want exact next-slot + trending separately,
      // split them into separate server-side computed values.
    }
  });

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
        industries={industries.length ? (industries as any) : ([Industry.BEAUTY_AND_CARE] as any)}
        initialQ={qRaw}
        initialCity={normalize(sp.city)}
        initialIndustry={(normalize(sp.industry) || "All") as any}
        dict={dict} // ✅ required by the fixed ExploreClient
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
