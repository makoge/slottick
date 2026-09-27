// app/[locale]/services/[...slug]/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { locales } from "@/lib/i18n";
import { TARGET_COUNTRIES, TARGET_CATEGORIES } from "@/lib/seo/targets";
import { SEO_CITIES_20, SEO_INTENTS_10 } from "@/lib/seo/near-me-targets";
import { KEYWORD_PAGES } from "@/lib/seo/keywords";
import { slugify } from "@/lib/seo/slug";

type Params = {
  locale: string;
  slug: string[];
};

function baseUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://slottick.com").replace(
    /\/$/,
    "",
  );
}

function ogLocale(locale: string) {
  const map: Record<string, string> = { en: "en_US", fr: "fr_FR" };
  return map[locale] || "en_US";
}

function formatLabel(str?: string) {
  if (!str) return "";
  return decodeURIComponent(str)
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function getCurrency(country?: string | null) {
  if (country === "US") return "USD";
  if (country === "GB" || country === "UK") return "GBP";
  return "EUR";
}

/* -------------------------------------------------------------------------- */
/*                           SEGMENT 3 HELPERS (GEO)                          */
/* -------------------------------------------------------------------------- */
function resolveCountry(countrySlug: string) {
  const clean = String(countrySlug || "").toLowerCase();
  const aliases: Record<string, string> = {
    uk: "united-kingdom",
    usa: "united-states",
  };
  const normalized = aliases[clean] || clean;
  const found = TARGET_COUNTRIES.find(
    (c) =>
      c.slug.toLowerCase() === normalized || c.slug.toLowerCase() === clean,
  );
  if (found) return found;

  return {
    slug: clean,
    name: formatLabel(clean),
    cities: [] as string[],
  };
}

function resolveCity(
  country: ReturnType<typeof resolveCountry>,
  citySlug: string,
) {
  const clean = String(citySlug || "").toLowerCase();
  const found = country.cities.find((c) => slugify(c) === clean);
  return found || formatLabel(clean);
}

function resolveCategory(categorySlug: string) {
  const clean = String(categorySlug || "").toLowerCase();
  const found = TARGET_CATEGORIES.find((c) => c.slug.toLowerCase() === clean);
  if (found) return found;

  return {
    slug: clean,
    label: formatLabel(clean),
  };
}

function exploreCategoryParam(categorySlug: string) {
  const map: Record<string, string> = {
    "beauty-salons": "Other",
    "lash-techs": "Lash",
    "hair-braiders": "Hair",
    barbers: "Barber",
    "nail-salons": "Nails",
    massage: "Massage",
  };
  return map[categorySlug.toLowerCase()] ?? "Other";
}

/* -------------------------------------------------------------------------- */
/*                         SEGMENT 2 HELPERS (NEAR ME)                        */
/* -------------------------------------------------------------------------- */
function resolveIntent(slug: string) {
  const found = SEO_INTENTS_10.find((x) => x.slug === slug);
  if (found) return found;

  const title = formatLabel(slug);
  return {
    slug,
    title,
    categoryParam: "Other",
    synonyms: [
      "local specialists",
      "top studios",
      "verified artisans",
      "appointments",
    ],
    faqs: [
      {
        q: "How do I book appointments on Slottick?",
        a: "Select a provider, review available live calendar slots, and confirm your booking instantly without back-and-forth messaging.",
      },
      {
        q: "Are the time slots shown up to date?",
        a: "Yes, appointment slots synchronize directly with each specialist's working calendar in real time.",
      },
    ],
  };
}

function resolveNearMeCity(slug: string) {
  const found = SEO_CITIES_20.find((x) => x.slug === slug);
  if (found) return found;

  return {
    slug,
    name: formatLabel(slug),
    countryName: null,
  };
}

function formatNearMeHeading(
  intentTitle: string,
  cityName: string,
  country: string,
  locale: string,
) {
  const cleanedIntent = intentTitle.replace(/\s*near\s*me/gi, "").trim();
  if (locale === "fr") return `${cleanedIntent} à ${cityName}${country}`;
  return `${cleanedIntent} in ${cityName}${country}`;
}

/* -------------------------------------------------------------------------- */
/*                         SEGMENT 1 HELPERS (DISCOVER)                       */
/* -------------------------------------------------------------------------- */
function bookingTips(title: string) {
  const t = title.toLowerCase();

  if (t.includes("barber") || t.includes("haircut") || t.includes("beard")) {
    return {
      heading: "Booking tips",
      bullets: [
        "Bring a reference photo (fade height, taper level, beard shape).",
        "If booking haircut + beard trim, select the bundle so enough time is reserved.",
        "Pick a time slot with buffer room—top grooming cannot be rushed.",
      ],
    };
  }

  if (
    t.includes("braid") ||
    t.includes("knotless") ||
    t.includes("box") ||
    t.includes("cornrows") ||
    t.includes("twists") ||
    t.includes("loc")
  ) {
    return {
      heading: "Booking tips",
      bullets: [
        "Braiding is time-intensive—reserve the exact service length matching your hair.",
        "Use appointment notes to specify hair length, parting style, and hair extensions.",
        "Opt for morning appointments for full sets that require multiple hours.",
      ],
    };
  }

  if (t.includes("nail") || t.includes("manicure") || t.includes("pedicure")) {
    return {
      heading: "Booking tips",
      bullets: [
        "If you need removal + new set, select both to avoid timing conflicts.",
        "Confirm whether you prefer gel, BIAB, or acrylic before completing the booking.",
        "Add nail art as an add-on service so the nail technician has sufficient time.",
      ],
    };
  }

  return {
    heading: "Booking tips",
    bullets: [
      "Select the specific service duration so your schedule slot is protected.",
      "Add notes for special preferences, allergies, or reference styles.",
      "Review portfolios, client ratings, and confirmed working hours.",
    ],
  };
}

function buildExplorePath(
  locale: string,
  pageData?: (typeof KEYWORD_PAGES)[number],
) {
  const qs = new URLSearchParams();
  if (pageData?.city) qs.set("city", pageData.city);
  if (pageData?.explore?.category)
    qs.set("category", pageData.explore.category);
  if (pageData?.explore?.q) qs.set("q", pageData.explore.q);
  return `/${locale}/explore?${qs.toString()}`;
}

/* -------------------------------------------------------------------------- */
/*                        DATABASE: FETCH AREA SHOPS                          */
/* -------------------------------------------------------------------------- */
async function getAreaBusinesses(cityName?: string) {
  try {
    let shops = cityName
      ? await prisma.business.findMany({
          where: {
            marketplaceEligibleAt: { not: null },
            city: { equals: cityName, mode: "insensitive" },
          },
          select: {
            id: true,
            name: true,
            slug: true,
            city: true,
            country: true,
            services: {
              take: 2,
              select: {
                name: true,
                price: true,
                currency: true,
                durationMin: true,
              },
            },
          },
          take: 6,
        })
      : [];

    if (shops.length === 0) {
      shops = await prisma.business.findMany({
        where: { marketplaceEligibleAt: { not: null } },
        select: {
          id: true,
          name: true,
          slug: true,
          city: true,
          country: true,
          services: {
            take: 2,
            select: {
              name: true,
              price: true,
              currency: true,
              durationMin: true,
            },
          },
        },
        take: 4,
      });
    }

    return shops;
  } catch (error) {
    console.error("Failed to query area businesses:", error);
    return [];
  }
}

/* -------------------------------------------------------------------------- */
/*                            STATIC PARAMS GENERATOR                         */
/* -------------------------------------------------------------------------- */
export async function generateStaticParams() {
  const params: Params[] = [];

  for (const locale of locales) {
    // Segment 3: /[locale]/services/[countrySlug]/[citySlug]/[categorySlug]
    for (const country of TARGET_COUNTRIES) {
      for (const city of country.cities) {
        for (const category of TARGET_CATEGORIES) {
          params.push({
            locale,
            slug: [country.slug, slugify(city), category.slug],
          });
        }
      }
    }

    // Segment 2: /[locale]/services/[intent]/[city]
    for (const intent of SEO_INTENTS_10) {
      for (const city of SEO_CITIES_20) {
        params.push({
          locale,
          slug: [intent.slug, city.slug],
        });
      }
    }

    // Segment 1: /[locale]/services/[keywordSlug]
    for (const p of KEYWORD_PAGES) {
      const slugVal = (p as any).slug;
      if (slugVal) {
        params.push({
          locale,
          slug: [slugify(slugVal)],
        });
      }
    }
  }

  return params;
}

/* -------------------------------------------------------------------------- */
/*                              METADATA GENERATOR                            */
/* -------------------------------------------------------------------------- */
export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const urlBase = baseUrl();
  const ogImg = `${urlBase}/og.png`;
  const canonical = `${urlBase}/${locale}/services/${slug.join("/")}`;

  // SEGMENT 3: Country / City / Category
  if (slug.length === 3) {
    const [countrySlug, citySlug, categorySlug] = slug;
    const country = resolveCountry(countrySlug);
    const city = resolveCity(country, citySlug);
    const category = resolveCategory(categorySlug);

    const title = `${category.label} in ${city} | Slottick`;
    const description = `Book verified ${category.label.toLowerCase()} in ${city}, ${country.name}. Real-time slots, upfront pricing, and direct reservations on Slottick.`;

    return {
      metadataBase: new URL(urlBase),
      title,
      description,
      alternates: { canonical },
      robots: { index: true, follow: true },
      openGraph: {
        type: "website",
        url: canonical,
        siteName: "Slottick",
        title,
        description,
        locale: ogLocale(locale),
        images: [{ url: ogImg, width: 1200, height: 630, alt: "Slottick" }],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [ogImg],
      },
    };
  }

  // SEGMENT 2: Intent / City
  if (slug.length === 2) {
    const [intentSlug, citySlug] = slug;
    const intentObj = resolveIntent(intentSlug);
    const cityObj = resolveNearMeCity(citySlug);

    const cityName = cityObj.name;
    const country = cityObj.countryName ? `, ${cityObj.countryName}` : "";
    const pageTitle = formatNearMeHeading(
      intentObj.title,
      cityName,
      country,
      locale,
    );
    const description = `Find and book verified ${pageTitle.toLowerCase()}. Compare shops, inspect live availability, and reserve directly on Slottick.`;

    return {
      metadataBase: new URL(urlBase),
      title: `${pageTitle} | Slottick`,
      description,
      alternates: { canonical },
      robots: { index: true, follow: true },
      openGraph: {
        type: "website",
        url: canonical,
        siteName: "Slottick",
        title: pageTitle,
        description,
        locale: ogLocale(locale),
        images: [{ url: ogImg, width: 1200, height: 630, alt: "Slottick" }],
      },
      twitter: {
        card: "summary_large_image",
        title: `${pageTitle} | Slottick`,
        description,
        images: [ogImg],
      },
    };
  }

  // SEGMENT 1: Keyword Landing
  if (slug.length === 1) {
    const [keywordSlug] = slug;
    const p = KEYWORD_PAGES.find(
      (x) => slugify(x.slug) === keywordSlug.toLowerCase(),
    );

    const title = p?.title || `${formatLabel(keywordSlug)} | Slottick`;
    const description =
      p?.intro ||
      `Discover and book verified specialists for ${formatLabel(keywordSlug)}. Live availability, transparent pricing, and instant confirmations on Slottick.`;

    return {
      metadataBase: new URL(urlBase),
      title,
      description,
      alternates: { canonical },
      robots: { index: true, follow: true },
      openGraph: {
        type: "website",
        url: canonical,
        siteName: "Slottick",
        title,
        description,
        locale: ogLocale(locale),
        images: [{ url: ogImg, width: 1200, height: 630, alt: "Slottick" }],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [ogImg],
      },
    };
  }

  return { robots: { index: false, follow: false } };
}

/* -------------------------------------------------------------------------- */
/*                               MAIN COMPONENT                               */
/* -------------------------------------------------------------------------- */
export default async function ServicesDispatcherPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale, slug } = await params;
  const urlBase = baseUrl();
  const canonical = `${urlBase}/${locale}/services/${slug.join("/")}`;

  // =========================================================================
  // VIEW 1 (SEGMENT 3): Country / City / Category
  // =========================================================================
  if (slug.length === 3) {
    const [countrySlug, citySlug, categorySlug] = slug;
    const country = resolveCountry(countrySlug);
    const city = resolveCity(country, citySlug);
    const category = resolveCategory(categorySlug);

    if (!country.name || !city || !category.label) notFound();

    const categoryLabel = category.label;
    const exploreHref = `/${locale}/explore?city=${encodeURIComponent(city)}&category=${encodeURIComponent(exploreCategoryParam(categorySlug))}`;
    const businesses = await getAreaBusinesses(city);

    const siblingCategories = TARGET_CATEGORIES.filter(
      (c) => c.slug !== category.slug,
    ).slice(0, 8);
    const siblingCities = country.cities.filter((c) => c !== city).slice(0, 8);

    const faqJsonLd = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: `How do I book ${categoryLabel.toLowerCase()} in ${city}?`,
          acceptedAnswer: {
            "@type": "Answer",
            text: `Open Slottick, filter by ${city} and ${categoryLabel}, pick a business, choose an available slot, and confirm instantly.`,
          },
        },
      ],
    };

    return (
      <div className="w-full bg-[#fafafa] py-8 text-slate-900 min-h-screen">
        <div className="mx-auto max-w-4xl space-y-8 px-4 sm:px-6">
          <section className="relative overflow-hidden rounded-3xl border border-slate-300/70 bg-white/80 p-6 shadow-sm backdrop-blur-xl sm:p-10">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-lime-300/80 bg-lime-100 px-3 py-1 font-mono text-xs font-semibold uppercase tracking-wider text-lime-950">
                <span className="h-1.5 w-1.5 rounded-full bg-lime-700" />
                Verified Services
              </span>
              <span className="rounded-full border border-slate-300/80 bg-white/80 px-3 py-1 font-mono text-xs font-medium text-slate-700">
                📍 {city}, {country.name}
              </span>
            </div>

            <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              {categoryLabel} in {city}
            </h1>

            <p className="mt-3 text-base leading-relaxed text-slate-700 sm:text-lg">
              Find verified {categoryLabel.toLowerCase()} in {city},{" "}
              {country.name}. Compare treatments, durations, and pricing, then
              book directly using live availability.
            </p>

            <div className="mt-5 space-y-2 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-700">
              <p>
                ✓ Live calendar openings synchronized directly with provider
                books.
              </p>
              <p>
                ✓ Transparent durations and pricing with no hidden checkout
                fees.
              </p>
              <p>✓ Instant confirmation without back-and-forth messages.</p>
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                href={exploreHref}
                className="inline-flex items-center justify-center rounded-2xl border border-lime-300/80 bg-lime-100 px-5 py-3 text-sm font-bold text-lime-950 shadow-xs transition-all hover:bg-lime-200 active:scale-95"
              >
                See availability in Explore
              </Link>
              <Link
                href={`/${locale}/explore`}
                className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white/80 px-5 py-3 text-sm font-semibold text-slate-800 shadow-xs backdrop-blur-md transition-all hover:bg-white hover:text-slate-950 active:scale-95"
              >
                Open marketplace
              </Link>
              <Link
                href={`/${locale}/register`}
                className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white/60 px-5 py-3 text-sm font-semibold text-slate-700 shadow-xs backdrop-blur-md transition-all hover:bg-white hover:text-slate-950 active:scale-95"
              >
                List your business
              </Link>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                Featured Spots & Availability
              </h2>
              <Link
                href={exploreHref}
                className="text-xs font-semibold text-slate-600 underline hover:text-slate-900"
              >
                View all in {city} →
              </Link>
            </div>

            {businesses.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {businesses.map((biz) => (
                  <div
                    key={biz.id}
                    className="flex flex-col justify-between rounded-2xl border border-slate-300/70 bg-white/90 p-5 shadow-sm transition-all hover:border-lime-400 hover:shadow-md"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-slate-900">{biz.name}</h3>
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 font-mono text-[11px] text-slate-600">
                          {biz.city || city}
                        </span>
                      </div>

                      {biz.services && biz.services.length > 0 && (
                        <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-3">
                          {biz.services.map((svc, i) => (
                            <div
                              key={i}
                              className="flex justify-between text-xs text-slate-600"
                            >
                              <span className="truncate pr-2">{svc.name}</span>
                              <span className="font-medium text-slate-900">
                                {svc.price != null
                                  ? `${svc.price} ${svc.currency || getCurrency(biz.country)}`
                                  : "Listed"}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <Link
                      href={`/${locale}/book/${encodeURIComponent(biz.slug)}`}
                      className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-slate-900 py-2.5 text-xs font-semibold text-white transition-all hover:bg-slate-800"
                    >
                      Book Appointment →
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-600">
                <p>
                  New spots in {city} are actively joining the booking network.
                </p>
                <Link
                  href={exploreHref}
                  className="mt-3 inline-block font-semibold text-slate-900 underline"
                >
                  Search all openings in Explore →
                </Link>
              </div>
            )}
          </section>

          {siblingCategories.length > 0 && (
            <section className="rounded-3xl border border-slate-300/70 bg-white/60 p-6 shadow-xs backdrop-blur-xl sm:p-8">
              <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-600">
                More in {city}
              </h2>
              <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                {siblingCategories.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/${locale}/services/${countrySlug}/${citySlug}/${c.slug}`}
                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-sm font-medium text-slate-800 transition-all hover:border-lime-400 hover:bg-lime-50/50"
                  >
                    <span>
                      {c.label} in {city}
                    </span>
                    <span className="text-xs text-slate-400">→</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {siblingCities.length > 0 && (
            <section className="rounded-3xl border border-slate-300/70 bg-white/60 p-6 shadow-xs backdrop-blur-xl sm:p-8">
              <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-600">
                {categoryLabel} in other cities
              </h2>
              <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                {siblingCities.map((ct) => (
                  <Link
                    key={ct}
                    href={`/${locale}/services/${countrySlug}/${slugify(ct)}/${categorySlug}`}
                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-sm font-medium text-slate-800 transition-all hover:border-lime-400 hover:bg-lime-50/50"
                  >
                    <span>
                      {categoryLabel} in {ct}
                    </span>
                    <span className="text-xs text-slate-400">→</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <nav className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-300/50 bg-white/40 px-4 py-3 font-mono text-xs text-slate-600 backdrop-blur-md">
            <span className="font-semibold text-slate-900">Explore:</span>
            <Link
              className="hover:text-slate-950 hover:underline"
              href={`/${locale}`}
            >
              Home
            </Link>
            <span>/</span>
            <Link
              className="hover:text-slate-950 hover:underline"
              href={`/${locale}/explore`}
            >
              Explore
            </Link>
            <span>/</span>
            <Link
              className="hover:text-slate-950 hover:underline"
              href={`/${locale}/register`}
            >
              List business
            </Link>
          </nav>
        </div>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      </div>
    );
  }

  // =========================================================================
  // VIEW 2 (SEGMENT 2): Intent / City
  // =========================================================================
  if (slug.length === 2) {
    const [intentSlug, citySlug] = slug;
    const intentObj = resolveIntent(intentSlug);
    const cityObj = resolveNearMeCity(citySlug);

    if (!intentObj.title || !cityObj.name) notFound();

    const cityName = cityObj.name;
    const country = cityObj.countryName ? `, ${cityObj.countryName}` : "";
    const mainHeading = formatNearMeHeading(
      intentObj.title,
      cityName,
      country,
      locale,
    );

    const exploreQs = new URLSearchParams();
    if (intentObj.categoryParam && intentObj.categoryParam !== "Other") {
      exploreQs.set("category", intentObj.categoryParam);
    }
    exploreQs.set("city", cityName);
    const exploreHref = `/${locale}/explore?${exploreQs.toString()}`;
    const businesses = await getAreaBusinesses(cityName);

    return (
      <div className="w-full bg-[#fafafa] py-8 text-slate-900 min-h-screen">
        <div className="mx-auto max-w-4xl space-y-8 px-4 sm:px-6">
          <section className="relative overflow-hidden rounded-3xl border border-slate-300/70 bg-white/80 p-6 shadow-sm backdrop-blur-xl sm:p-10">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-lime-300/80 bg-lime-100 px-3 py-1 font-mono text-xs font-semibold uppercase tracking-wider text-lime-950">
                <span className="h-1.5 w-1.5 rounded-full bg-lime-700" />
                Verified Near You
              </span>
              <span className="rounded-full border border-slate-300/80 bg-white/80 px-3 py-1 font-mono text-xs font-medium text-slate-700">
                📍 {cityName}
                {country}
              </span>
            </div>

            <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              {mainHeading}
            </h1>

            <p className="mt-3 text-base leading-relaxed text-slate-700 sm:text-lg">
              Compare verified specialists in {cityName}, view real available
              calendar slots, and book your appointment directly without
              back-and-forth messaging.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                href={exploreHref}
                className="inline-flex items-center justify-center rounded-2xl border border-lime-300/80 bg-lime-100 px-5 py-3 text-sm font-bold text-lime-950 shadow-xs transition-all hover:bg-lime-200 active:scale-95"
              >
                Browse slots in {cityName}
              </Link>
              <Link
                href={`/${locale}/explore`}
                className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white/80 px-5 py-3 text-sm font-semibold text-slate-800 shadow-xs backdrop-blur-md transition-all hover:bg-white hover:text-slate-950 active:scale-95"
              >
                Open marketplace
              </Link>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                Available Studios in {cityName}
              </h2>
              <Link
                href={exploreHref}
                className="text-xs font-semibold text-slate-600 underline hover:text-slate-900"
              >
                View all in {cityName} →
              </Link>
            </div>

            {businesses.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {businesses.map((biz) => (
                  <div
                    key={biz.id}
                    className="flex flex-col justify-between rounded-2xl border border-slate-300/70 bg-white/90 p-5 shadow-sm transition-all hover:border-lime-400 hover:shadow-md"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-slate-900">{biz.name}</h3>
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 font-mono text-[11px] text-slate-600">
                          {biz.city || cityName}
                        </span>
                      </div>

                      {biz.services && biz.services.length > 0 && (
                        <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-3">
                          {biz.services.map((svc, i) => (
                            <div
                              key={i}
                              className="flex justify-between text-xs text-slate-600"
                            >
                              <span className="truncate pr-2">{svc.name}</span>
                              <span className="font-medium text-slate-900">
                                {svc.price != null
                                  ? `${svc.price} ${svc.currency || getCurrency(biz.country)}`
                                  : "Listed"}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <Link
                      href={`/${locale}/book/${encodeURIComponent(biz.slug)}`}
                      className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-slate-900 py-2.5 text-xs font-semibold text-white transition-all hover:bg-slate-800"
                    >
                      Book Appointment →
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-600">
                <p>
                  New providers in {cityName} are regularly joining Slottick.
                </p>
                <Link
                  href={exploreHref}
                  className="mt-3 inline-block font-semibold text-slate-900 underline"
                >
                  Browse all marketplace openings →
                </Link>
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-slate-300/70 bg-white/80 p-6 shadow-sm backdrop-blur-xl sm:p-8">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              Frequently Asked Questions
            </h2>
            <div className="mt-4 space-y-4">
              {intentObj.faqs.map((f) => (
                <div
                  key={f.q}
                  className="rounded-2xl border border-slate-200 bg-white/60 p-4"
                >
                  <div className="font-semibold text-slate-900 text-sm">
                    {f.q}
                  </div>
                  <div className="mt-1.5 text-xs leading-relaxed text-slate-600">
                    {f.a}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <nav className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-300/50 bg-white/40 px-4 py-3 font-mono text-xs text-slate-600 backdrop-blur-md">
            <span className="font-semibold text-slate-900">Explore:</span>
            <Link
              className="hover:text-slate-950 hover:underline"
              href={`/${locale}`}
            >
              Home
            </Link>
            <span>/</span>
            <Link
              className="hover:text-slate-950 hover:underline"
              href={`/${locale}/explore`}
            >
              Explore
            </Link>
            <span>/</span>
            <Link
              className="hover:text-slate-950 hover:underline"
              href={`/${locale}/register`}
            >
              List business
            </Link>
          </nav>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 3 (SEGMENT 1): Keyword / Discover Landing
  // =========================================================================
  if (slug.length === 1) {
    const [keywordSlug] = slug;
    const p = KEYWORD_PAGES.find(
      (x) => slugify(x.slug) === keywordSlug.toLowerCase(),
    );

    const pageTitle = p?.title || formatLabel(keywordSlug);
    const pageIntro =
      p?.intro ||
      `Browse top-rated studios and independent specialists. Compare portfolios, real-time availability, and book your appointment instantly.`;
    const locationTag = p?.city || "Featured";

    const exploreHref = buildExplorePath(locale, p);
    const tips = bookingTips(pageTitle);
    const businesses = await getAreaBusinesses(p?.city);

    const breadcrumbJsonLd = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: `${urlBase}/${locale}`,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Explore",
          item: `${urlBase}/${locale}/explore`,
        },
        { "@type": "ListItem", position: 3, name: pageTitle, item: canonical },
      ],
    };

    return (
      <div className="w-full bg-[#fafafa] py-8 text-slate-900 min-h-screen">
        <div className="mx-auto max-w-4xl space-y-8 px-4 sm:px-6">
          <section className="relative overflow-hidden rounded-3xl border border-slate-300/70 bg-white/80 p-6 shadow-sm backdrop-blur-xl sm:p-10">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-lime-300/80 bg-lime-100 px-3 py-1 font-mono text-xs font-semibold uppercase tracking-wider text-lime-950">
                <span className="h-1.5 w-1.5 rounded-full bg-lime-700" />
                Verified Services
              </span>
              <span className="rounded-full border border-slate-300/80 bg-white/80 px-3 py-1 font-mono text-xs font-medium text-slate-700">
                📍 {locationTag}
              </span>
            </div>

            <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              {pageTitle}
            </h1>

            <p className="mt-3 text-base leading-relaxed text-slate-700 sm:text-lg">
              {pageIntro}
            </p>

            <div className="mt-5 space-y-2 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-700">
              <p>
                ✓ Live calendar openings synchronized directly with provider
                books.
              </p>
              <p>
                ✓ Transparent durations and pricing with no hidden checkout
                fees.
              </p>
              <p>✓ Instant confirmation without back-and-forth messages.</p>
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                href={exploreHref}
                className="inline-flex items-center justify-center rounded-2xl border border-lime-300/80 bg-lime-100 px-5 py-3 text-sm font-bold text-lime-950 shadow-xs transition-all hover:bg-lime-200 active:scale-95"
              >
                See availability in Explore
              </Link>
              <Link
                href={`/${locale}/explore`}
                className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white/80 px-5 py-3 text-sm font-semibold text-slate-800 shadow-xs backdrop-blur-md transition-all hover:bg-white hover:text-slate-950 active:scale-95"
              >
                Open marketplace
              </Link>
              <Link
                href={`/${locale}/register`}
                className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white/60 px-5 py-3 text-sm font-semibold text-slate-700 shadow-xs backdrop-blur-md transition-all hover:bg-white hover:text-slate-950 active:scale-95"
              >
                List your business
              </Link>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                Featured Spots & Availability
              </h2>
              <Link
                href={exploreHref}
                className="text-xs font-semibold text-slate-600 underline hover:text-slate-900"
              >
                View in Explore →
              </Link>
            </div>

            {businesses.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {businesses.map((biz) => (
                  <div
                    key={biz.id}
                    className="flex flex-col justify-between rounded-2xl border border-slate-300/70 bg-white/90 p-5 shadow-sm transition-all hover:border-lime-400 hover:shadow-md"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-slate-900">{biz.name}</h3>
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 font-mono text-[11px] text-slate-600">
                          {biz.city || "Featured"}
                        </span>
                      </div>

                      {biz.services && biz.services.length > 0 && (
                        <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-3">
                          {biz.services.map((svc, i) => (
                            <div
                              key={i}
                              className="flex justify-between text-xs text-slate-600"
                            >
                              <span className="truncate pr-2">{svc.name}</span>
                              <span className="font-medium text-slate-900">
                                {svc.price != null
                                  ? `${svc.price} ${svc.currency || getCurrency(biz.country)}`
                                  : "Listed"}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <Link
                      href={`/${locale}/book/${encodeURIComponent(biz.slug)}`}
                      className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-slate-900 py-2.5 text-xs font-semibold text-white transition-all hover:bg-slate-800"
                    >
                      Book Appointment →
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-600">
                <p>
                  Top local specialists are regularly joining the booking
                  network.
                </p>
                <Link
                  href={exploreHref}
                  className="mt-3 inline-block font-semibold text-slate-900 underline"
                >
                  Search all openings in Explore →
                </Link>
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-slate-300/70 bg-white/80 p-6 shadow-sm backdrop-blur-xl sm:p-8">
            <div className="flex items-center gap-2.5 border-b border-slate-200 pb-4">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-lime-300/80 bg-lime-100 font-mono text-xs font-bold text-lime-950">
                ✓
              </span>
              <h2 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
                {tips.heading}
              </h2>
            </div>

            <ul className="mt-4 space-y-3">
              {tips.bullets.map((bullet) => (
                <li
                  key={bullet}
                  className="flex items-start gap-3 text-sm leading-relaxed text-slate-700"
                >
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-slate-400" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </section>

          <nav className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-300/50 bg-white/40 px-4 py-3 font-mono text-xs text-slate-600 backdrop-blur-md">
            <span className="font-semibold text-slate-900">Explore:</span>
            <Link
              className="hover:text-slate-950 hover:underline"
              href={`/${locale}`}
            >
              Home
            </Link>
            <span>/</span>
            <Link
              className="hover:text-slate-950 hover:underline"
              href={`/${locale}/explore`}
            >
              Explore
            </Link>
            <span>/</span>
            <Link
              className="hover:text-slate-950 hover:underline"
              href={`/${locale}/register`}
            >
              List business
            </Link>
          </nav>
        </div>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
        />
      </div>
    );
  }

  notFound();
}
