// app/[locale]/services/[intent]/[city]/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { locales } from "@/lib/i18n";
import { SEO_CITIES_20, SEO_INTENTS_10 } from "@/lib/seo/near-me-targets";

type Params = {
  locale: string;
  intent: string;
  city: string;
};

function getBaseUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://slottick.com").replace(/\/$/, "");
}

function titleCase(s: string) {
  return s
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// Optional OG locale map (keep only what you actually support)
function ogLocale(locale: string) {
  const map: Record<string, string> = { en: "en_US", fr: "fr_FR" };
  return map[locale];
}

function buildExploreHref(locale: string, intentSlug: string, citySlug: string) {
  const intent = SEO_INTENTS_10.find((x) => x.slug === intentSlug);
  const city = SEO_CITIES_20.find((x) => x.slug === citySlug);

  const qs = new URLSearchParams();
  if (intent?.categoryParam) qs.set("category", intent.categoryParam);
  if (city?.name) qs.set("city", city.name);

  return `/${locale}/explore${qs.toString() ? `?${qs.toString()}` : ""}`;
}

// small variation engine so it doesn’t feel copy/paste
function generateContentBlocks(intentSlug: string, citySlug: string) {
  const intent = SEO_INTENTS_10.find((x) => x.slug === intentSlug);
  const city = SEO_CITIES_20.find((x) => x.slug === citySlug);

  const cityName = city?.name ?? titleCase(citySlug);
  const country = city?.countryName ? `, ${city.countryName}` : "";
  const intentTitle = intent?.title ?? titleCase(intentSlug);

  const synonyms = intent?.synonyms ?? [];
  const s1 = synonyms[0] ?? "local providers";
  const s2 = synonyms[1] ?? "popular options";
  const s3 = synonyms[2] ?? "appointments";
  const s4 = synonyms[3] ?? "nearby businesses";

  const bullets = [
    `Filter ${intentTitle.toLowerCase()} in ${cityName}${country} by category and availability.`,
    `Pick a time slot that actually fits the provider’s schedule (no guessing).`,
    `Compare businesses faster: services, durations, and clear booking flow.`,
    `Book in minutes — then manage changes without endless messages.`
  ];

  const paragraphs = [
    `${intentTitle} searches usually mean one thing: you want something available soon and easy to book. Slottick helps you find ${s1} in ${cityName}${country} and reserve a slot that matches real availability.`,
    `Instead of calling around, browse businesses, check services and durations, and confirm instantly. This works especially well for ${s2}, where timing matters as much as quality.`,
    `If you’re looking for ${s3} in ${cityName}, start by filtering by city and category, then open a business page to see live times.`,
    `Want more choice? Use Explore to browse ${s4}, compare options, and book without the back-and-forth.`
  ];

  return { cityName, country, intentTitle, paragraphs, bullets };
}

export async function generateStaticParams() {
  const all: Params[] = [];
  for (const locale of locales) {
    for (const intent of SEO_INTENTS_10) {
      for (const city of SEO_CITIES_20) {
        all.push({ locale, intent: intent.slug, city: city.slug });
      }
    }
  }
  return all;
}

export async function generateMetadata({
  params
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { locale, intent, city } = await params;

  const baseUrl = getBaseUrl();
  const ogImg = `${baseUrl}/og.png`;

  const intentObj = SEO_INTENTS_10.find((x) => x.slug === intent);
  const cityObj = SEO_CITIES_20.find((x) => x.slug === city);

  if (!intentObj || !cityObj) return { robots: { index: false, follow: false } };

  const cityName = cityObj.name ?? titleCase(city);
  const country = cityObj.countryName ? `, ${cityObj.countryName}` : "";

  const pageTitle =
    intentObj.slug === "best-beauty-services-in-city"
      ? `Best beauty services in ${cityName}${country}`
      : `${intentObj.title ?? titleCase(intent)} in ${cityName}${country}`;

  const description = `Find and book ${pageTitle.toLowerCase()}. Compare businesses, check real availability, and book instantly on Slottick.`;

  const canonical = `${baseUrl}/${locale}/services/${intent}/${city}`;

  // Keep hreflang only if these pages exist per locale
  const languages = Object.fromEntries(
    locales.map((l) => [l, `${baseUrl}/${l}/services/${intent}/${city}`])
  );

  return {
    metadataBase: new URL(baseUrl),
    title: `${pageTitle} | Slottick`,
    description,
    alternates: { canonical, languages },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1
      }
    },
    openGraph: {
      type: "website",
      url: canonical,
      siteName: "Slottick",
      title: pageTitle,
      description,
      locale: ogLocale(locale),
      images: [{ url: ogImg, width: 1200, height: 630, alt: "Slottick" }]
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description,
      images: [ogImg]
    }
  };
}

export default async function Page({ params }: { params: Promise<Params> }) {
  const { locale, intent, city } = await params;

  const intentObj = SEO_INTENTS_10.find((x) => x.slug === intent);
  const cityObj = SEO_CITIES_20.find((x) => x.slug === city);

  if (!intentObj || !cityObj) notFound();

  const baseUrl = getBaseUrl();
  const canonical = `${baseUrl}/${locale}/services/${intent}/${city}`;

  const exploreHref = buildExploreHref(locale, intent, city);
  const { cityName, country, intentTitle, paragraphs, bullets } = generateContentBlocks(intent, city);

  const mainHeading =
    intentObj.slug === "best-beauty-services-in-city"
      ? `Best beauty services in ${cityName}${country}`
      : `${intentTitle} in ${cityName}${country}`;

  // internal links (strong + safe)
  const siblingIntents = SEO_INTENTS_10.filter((x) => x.slug !== intent).slice(0, 8);
  const siblingCities = SEO_CITIES_20.filter((x) => x.slug !== city).slice(0, 8);

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: intentObj.faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a }
    }))
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${baseUrl}/${locale}` },
      { "@type": "ListItem", position: 2, name: "Explore", item: `${baseUrl}/${locale}/explore` },
      { "@type": "ListItem", position: 3, name: mainHeading, item: canonical }
    ]
  };

  return (
    <>
      <main className="min-h-screen bg-white text-slate-900">
        <div className="mx-auto max-w-4xl px-6 py-14">
          <p className="text-sm font-medium text-slate-600">Slottick • Services</p>

          <h1 className="mt-2 text-4xl font-bold tracking-tight">{mainHeading}</h1>

          <p className="mt-4 text-lg text-slate-600">
            Compare businesses, check real availability, and book instantly — no back-and-forth.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={exploreHref}
              className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Browse available services in {cityName}
            </Link>

            <Link
              href={`/${locale}/explore`}
              className="rounded-xl border border-slate-200 px-6 py-3 text-sm font-semibold hover:bg-slate-50"
            >
              Open full marketplace
            </Link>
          </div>

          <section className="mt-10 space-y-4">
            {paragraphs.map((p, idx) => (
              <p key={idx} className="leading-relaxed text-slate-700">
                {p}
              </p>
            ))}
          </section>

          <section className="mt-10 rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <h2 className="text-xl font-semibold">How to choose the right option</h2>
            <ul className="mt-4 list-disc space-y-2 pl-6 text-slate-700">
              {bullets.map((b, idx) => (
                <li key={idx}>{b}</li>
              ))}
            </ul>
          </section>

          {/* Strong internal links */}
          <section className="mt-10 grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 p-6">
              <h2 className="text-lg font-semibold">More services in {cityName}</h2>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {siblingIntents.map((i) => (
                  <Link
                    key={i.slug}
                    href={`/${locale}/services/${i.slug}/${city}`}
                    className="text-sm underline text-slate-700 hover:text-slate-900"
                  >
                    {i.title} in {cityName}
                  </Link>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 p-6">
              <h2 className="text-lg font-semibold">{intentTitle} in other cities</h2>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {siblingCities.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/${locale}/services/${intent}/${c.slug}`}
                    className="text-sm underline text-slate-700 hover:text-slate-900"
                  >
                    {intentTitle} in {c.name}
                  </Link>
                ))}
              </div>
            </div>
          </section>

          <section className="mt-12">
            <h2 className="text-2xl font-semibold">FAQ</h2>
            <div className="mt-4 space-y-5">
              {intentObj.faqs.map((f) => (
                <div key={f.q} className="rounded-2xl border border-slate-200 p-5">
                  <div className="font-semibold">{f.q}</div>
                  <div className="mt-2 text-slate-700">{f.a}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-12 rounded-2xl border border-slate-200 p-6">
            <h2 className="text-xl font-semibold">Ready to book?</h2>
            <p className="mt-2 text-slate-600">
              Go to Explore and filter by city + category to see real time slots.
            </p>
            <div className="mt-5">
              <Link className="font-semibold underline" href={exploreHref}>
                Explore {intentTitle.toLowerCase()} in {cityName}
              </Link>
            </div>
          </section>

          <nav className="mt-10 text-sm text-slate-600">
            <span className="font-semibold text-slate-900">More:</span>{" "}
            <Link className="underline" href={`/${locale}`}>
              Home
            </Link>{" "}
            •{" "}
            <Link className="underline" href={`/${locale}/explore`}>
              Explore
            </Link>{" "}
            •{" "}
            <Link className="underline" href={`/${locale}/register`}>
              List your business
            </Link>
          </nav>
        </div>
      </main>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
    </>
  );
}
