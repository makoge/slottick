// app/[locale]/guides/[locationSlug]/[serviceSlug]/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { locales } from "@/lib/i18n";
import {
  guidePairs,
  findLocation,
  findService,
  prettyLocationName,
  safeInternalSlug,
  GUIDE_SERVICES,
} from "@/lib/seo/guides";

type Params = {
  locale: string;
  locationSlug: string;
  serviceSlug: string;
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
/*                         RESILIENT LOCATION & SERVICE                       */
/* -------------------------------------------------------------------------- */
function resolveLocationData(slug: string) {
  const found = findLocation(slug);
  if (found) {
    return {
      slug,
      name: found.name,
      exploreCity: found.exploreCity ?? found.name,
      prettyName: prettyLocationName(found),
    };
  }

  const name = formatLabel(slug);
  return {
    slug,
    name,
    exploreCity: name,
    prettyName: name,
  };
}

function resolveServiceData(slug: string, locName: string) {
  const found = findService(slug);
  if (found) {
    return {
      slug: found.slug,
      label: found.label,
      headline: found.headlineTpl(locName),
      intro: found.introTpl(locName),
      exploreCategory: found.exploreCategory,
      exploreQ: found.exploreQ,
      sections: found.sectionsTpl(locName),
      faqs: found.faqsTpl(locName),
      relatedSlugs: found.relatedServiceSlugs || [],
    };
  }

  const label = formatLabel(slug);
  return {
    slug,
    label,
    headline: `Guide to Finding the Best ${label} in ${locName}`,
    intro: `Looking for top-tier ${label.toLowerCase()} in ${locName}? Compare verified specialists, read customer reviews, check upfront prices, and book directly using live calendar slots.`,
    exploreCategory: undefined,
    exploreQ: label,
    sections: [
      {
        h: `What to look for in a verified ${label.toLowerCase()} specialist`,
        p: [
          "Check verified customer reviews and past styling portfolios.",
          "Ensure transparent pricing and listed appointment durations upfront.",
          "Verify the cancellation terms and deposit policies before finalizing.",
        ],
      },
      {
        h: `How direct online scheduling works in ${locName}`,
        p: `Slottick connects directly with each specialist's live availability calendar. Choose your treatment, pick an open window that fits your schedule, and receive instant confirmation without waiting for phone calls or chat replies.`,
      },
    ],
    faqs: [
      {
        q: `How do I book an appointment for ${label.toLowerCase()} in ${locName}?`,
        a: `Use Slottick Explore to search for specialists in ${locName}, select an open calendar slot, and confirm your reservation instantly.`,
      },
      {
        q: `Are the appointment prices fixed?`,
        a: `Yes, all services listed on Slottick disclose upfront pricing and duration so you know the exact cost before completing checkout.`,
      },
    ],
    relatedSlugs: [],
  };
}

/* -------------------------------------------------------------------------- */
/*                        DATABASE: FETCH AREA SHOPS                          */
/* -------------------------------------------------------------------------- */
async function getAreaBusinesses(cityName: string) {
  try {
    let shops = await prisma.business.findMany({
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
    });

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
    console.error("Failed to query area businesses for guide:", error);
    return [];
  }
}

/* -------------------------------------------------------------------------- */
/*                            STATIC PARAMS & META                            */
/* -------------------------------------------------------------------------- */
export async function generateStaticParams() {
  const params: Params[] = [];
  for (const locale of locales) {
    for (const p of guidePairs()) {
      params.push({ locale, ...p });
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { locale, locationSlug, serviceSlug } = await params;

  const loc = resolveLocationData(locationSlug);
  const svc = resolveServiceData(serviceSlug, loc.name);

  const urlBase = baseUrl();
  const canonical = `${urlBase}/${locale}/guides/${locationSlug}/${serviceSlug}`;
  const ogImg = `${urlBase}/og.png`;

  const languages = Object.fromEntries(
    locales.map((l) => [
      l,
      `${urlBase}/${l}/guides/${locationSlug}/${serviceSlug}`,
    ]),
  );

  return {
    metadataBase: new URL(urlBase),
    title: `${svc.headline} | Slottick`,
    description: svc.intro,
    alternates: { canonical, languages },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    openGraph: {
      type: "article",
      url: canonical,
      siteName: "Slottick",
      title: `${svc.headline} | Slottick`,
      description: svc.intro,
      locale: ogLocale(locale),
      images: [{ url: ogImg, width: 1200, height: 630, alt: "Slottick" }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${svc.headline} | Slottick`,
      description: svc.intro,
      images: [ogImg],
    },
  };
}

/* -------------------------------------------------------------------------- */
/*                               PAGE COMPONENT                               */
/* -------------------------------------------------------------------------- */
export default async function GuidePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale, locationSlug, serviceSlug } = await params;

  const loc = resolveLocationData(locationSlug);
  const svc = resolveServiceData(serviceSlug, loc.name);

  if (!loc.name || !svc.label) notFound();

  const urlBase = baseUrl();
  const canonical = `${urlBase}/${locale}/guides/${locationSlug}/${serviceSlug}`;

  const exploreQs = new URLSearchParams();
  exploreQs.set("city", loc.exploreCity);
  if (svc.exploreCategory) exploreQs.set("category", svc.exploreCategory);
  if (svc.exploreQ) exploreQs.set("q", svc.exploreQ);
  const exploreHref = `/${locale}/explore?${exploreQs.toString()}`;

  const businesses = await getAreaBusinesses(loc.name);

  const otherServicesSameLocation = (GUIDE_SERVICES || [])
    .filter((x) => x.slug !== svc.slug)
    .slice(0, 8);

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
    headline: svc.headline,
    description: svc.intro,
    author: { "@type": "Organization", name: "Slottick" },
    publisher: {
      "@type": "Organization",
      name: "Slottick",
      logo: { "@type": "ImageObject", url: `${urlBase}/og.png` },
    },
    about: [svc.label, loc.name, "Online booking"],
    isPartOf: { "@type": "WebSite", name: "Slottick", url: urlBase },
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: svc.faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

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
      {
        "@type": "ListItem",
        position: 3,
        name: `${svc.label} in ${loc.name}`,
        item: canonical,
      },
    ],
  };

  return (
    <div className="w-full bg-[#fafafa] py-8 text-slate-900 min-h-screen">
      <div className="mx-auto max-w-4xl space-y-8 px-4 sm:px-6">
        {/* HERO CARD (Slottick Glassmorphism) */}
        <section className="relative overflow-hidden rounded-3xl border border-slate-300/70 bg-white/80 p-6 shadow-sm backdrop-blur-xl sm:p-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-lime-300/80 bg-lime-100 px-3 py-1 font-mono text-xs font-semibold uppercase tracking-wider text-lime-950">
              <span className="h-1.5 w-1.5 rounded-full bg-lime-700" />
              Verified Guide
            </span>
            <span className="rounded-full border border-slate-300/80 bg-white/80 px-3 py-1 font-mono text-xs font-medium text-slate-700">
              📍 {loc.prettyName}
            </span>
          </div>

          <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            {svc.label} in {loc.name}
          </h1>

          <p className="mt-3 text-base leading-relaxed text-slate-700 sm:text-lg">
            {svc.intro}
          </p>

          <div className="mt-5 space-y-2 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-700">
            <p>
              ✓ Live calendar openings synchronized directly with provider
              books.
            </p>
            <p>
              ✓ Transparent durations and pricing with no hidden checkout fees.
            </p>
            <p>✓ Instant confirmation without back-and-forth messages.</p>
          </div>

          {/* ACTION BUTTONS */}
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              href={exploreHref}
              className="inline-flex items-center justify-center rounded-2xl border border-lime-300/80 bg-lime-100 px-5 py-3 text-sm font-bold text-lime-950 shadow-xs transition-all hover:bg-lime-200 active:scale-95"
            >
              Browse slots in {loc.name}
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

        {/* NEARBY AVAILABLE SHOPS */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              Available Studios in {loc.name}
            </h2>
            <Link
              href={exploreHref}
              className="text-xs font-semibold text-slate-600 underline hover:text-slate-900"
            >
              View all in {loc.name} →
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
                        {biz.city || loc.name}
                      </span>
                    </div>

                    {biz.services && biz.services.length > 0 && (
                      <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-3">
                        {biz.services.map((s, i) => (
                          <div
                            key={i}
                            className="flex justify-between text-xs text-slate-600"
                          >
                            <span className="truncate pr-2">{s.name}</span>
                            <span className="font-medium text-slate-900">
                              {s.price != null
                                ? `${s.price} ${s.currency || getCurrency(biz.country)}`
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
                Specialists in {loc.name} are continually joining the network.
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

        {/* GUIDE CONTENT SECTIONS */}
        <section className="space-y-6">
          {svc.sections.map((s) => (
            <div
              key={safeInternalSlug(s.h)}
              className="rounded-3xl border border-slate-300/70 bg-white/80 p-6 shadow-sm backdrop-blur-xl sm:p-8"
            >
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                {s.h}
              </h2>
              {Array.isArray(s.p) ? (
                <ul className="mt-4 space-y-2 text-sm leading-relaxed text-slate-700">
                  {s.p.map((x, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-lime-600" />
                      <span>{x}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm leading-relaxed text-slate-700">
                  {s.p}
                </p>
              )}
            </div>
          ))}
        </section>

        {/* FAQS */}
        {svc.faqs.length > 0 && (
          <section className="rounded-3xl border border-slate-300/70 bg-white/80 p-6 shadow-sm backdrop-blur-xl sm:p-8">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              Frequently Asked Questions
            </h2>
            <div className="mt-4 space-y-4">
              {svc.faqs.map((f) => (
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
        )}

        {/* INTERNAL LINKS (OTHER SERVICES SAME LOCATION) */}
        {otherServicesSameLocation.length > 0 && (
          <section className="rounded-3xl border border-slate-300/70 bg-white/60 p-6 shadow-xs backdrop-blur-xl sm:p-8">
            <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-600">
              More services in {loc.name}
            </h2>
            <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
              {otherServicesSameLocation.map((x) => (
                <Link
                  key={x.slug}
                  href={`/${locale}/guides/${locationSlug}/${x.slug}`}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-sm font-medium text-slate-800 transition-all hover:border-lime-400 hover:bg-lime-50/50"
                >
                  <span>
                    {x.label} in {loc.name}
                  </span>
                  <span className="text-xs text-slate-400">→</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* FOOTER NAV */}
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
    </div>
  );
}
