// app/[locale]/seo/[intent]/[city]/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { locales } from "@/lib/i18n";
import { SEO_CITIES_20, SEO_INTENTS_10 } from "@/lib/seo/near-me-targets";

type Params = {
  locale: string;
  intent: string;
  city: string;
};

function getBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://slottick.com"
  );
}

function titleCase(s: string) {
  return s
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function buildExploreHref(locale: string, intentSlug: string, citySlug: string) {
  const intent = SEO_INTENTS_10.find((x) => x.slug === intentSlug);
  const city = SEO_CITIES_20.find((x) => x.slug === citySlug);

  const qs = new URLSearchParams();
  if (intent?.categoryParam) qs.set("category", intent.categoryParam);
  if (city?.name) qs.set("city", city.name);

  // your explore page
  return `/${locale}/explore?${qs.toString()}`;
}

// Simple variation engine so pages aren’t copy/paste
function generateContentBlocks(intentSlug: string, citySlug: string) {
  const intent = SEO_INTENTS_10.find((x) => x.slug === intentSlug);
  const city = SEO_CITIES_20.find((x) => x.slug === citySlug);

  const cityName = city?.name ?? titleCase(citySlug);
  const country = city?.countryName ? `, ${city.countryName}` : "";
  const intentTitle = intent?.title ?? titleCase(intentSlug);

  const synonyms = intent?.synonyms ?? [];
  const s1 = synonyms[0] ?? "local services";
  const s2 = synonyms[1] ?? "top-rated providers";
  const s3 = synonyms[2] ?? "appointments";
  const s4 = synonyms[3] ?? "nearby businesses";

  const bullets = [
    `Compare ${intentTitle.toLowerCase()} options in ${cityName}${country} by category and availability.`,
    `Use real-time booking to avoid back-and-forth messages and scheduling errors.`,
    `Choose businesses with reviews, clear service names, and consistent availability.`,
    `Book faster by filtering the marketplace for the exact service you want.`
  ];

  const paragraphs = [
    `${intentTitle} searches usually mean one thing: you want a service that’s available soon and easy to book. Slottick helps you find ${s1} in ${cityName}${country} and reserve a time that actually fits the provider’s schedule.`,
    `Instead of calling around, you can browse businesses, check service categories, and book directly. This is especially useful for ${s2}, where availability and timing matter as much as quality.`,
    `If you’re looking for ${s3} in ${cityName}, start by narrowing down the service type, then filter by city and category. When you find a provider you like, pick a slot and confirm instantly.`,
    `Want to explore more options? Slottick’s directory is built for discovery: browse ${s4}, compare ratings, and book in a few clicks.`
  ];

  return { cityName, country, intentTitle, paragraphs, bullets };
}

export async function generateStaticParams() {
  const all: Array<Params> = [];

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
  const intentObj = SEO_INTENTS_10.find((x) => x.slug === intent);
  const cityObj = SEO_CITIES_20.find((x) => x.slug === city);

  const cityName = cityObj?.name ?? titleCase(city);
  const country = cityObj?.countryName ? `, ${cityObj.countryName}` : "";
  const pageTitle = intentObj?.slug === "best-beauty-services-in-city"
    ? `Best beauty services in ${cityName}${country}`
    : `${intentObj?.title ?? titleCase(intent)} in ${cityName}${country}`;

  const description =
    `Find and book ${pageTitle.toLowerCase()}. Browse trusted local businesses, compare services, and book instantly with real availability on Slottick.`;

  const canonical = `${baseUrl}/${locale}/seo/${intent}/${city}`;
  const languages = Object.fromEntries(
    locales.map((l) => [l, `${baseUrl}/${l}/seo/${intent}/${city}`])
  );

  return {
    metadataBase: new URL(baseUrl),
    title: `${pageTitle} | Slottick`,
    description,
    alternates: { canonical, languages },
    robots: { index: true, follow: true },
    openGraph: {
      type: "website",
      url: canonical,
      siteName: "Slottick",
      title: pageTitle,
      description,
      locale,
      images: [{ url: "/og.png", width: 1200, height: 630, alt: "Slottick" }]
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description,
      images: ["/og.png"]
    }
  };
}

export default async function Page({
  params
}: {
  params: Promise<Params>;
}) {
  const { locale, intent, city } = await params;

  const intentObj = SEO_INTENTS_10.find((x) => x.slug === intent);
  const cityObj = SEO_CITIES_20.find((x) => x.slug === city);

  if (!intentObj || !cityObj) {
    // If someone hits random /seo/... URL, keep it clean
    return (
      <main className="mx-auto max-w-3xl px-6 py-14">
        <h1 className="text-3xl font-bold">Page not available</h1>
        <p className="mt-3 text-slate-600">
          This SEO page doesn’t exist. Try the marketplace instead.
        </p>
        <Link className="mt-6 inline-block underline" href={`/${locale}/explore`}>
          Open Explore
        </Link>
      </main>
    );
  }

  const exploreHref = buildExploreHref(locale, intent, city);

  const { cityName, country, intentTitle, paragraphs, bullets } =
    generateContentBlocks(intent, city);

  const mainHeading =
    intentObj.slug === "best-beauty-services-in-city"
      ? `Best beauty services in ${cityName}${country}`
      : `${intentTitle} in ${cityName}${country}`;

  // FAQ schema
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: intentObj.faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a }
    }))
  };

  // Breadcrumb schema
  const baseUrl = getBaseUrl();
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
        name: mainHeading,
        item: `${baseUrl}/${locale}/seo/${intent}/${city}`
      }
    ]
  };

  return (
    <>
      <main className="min-h-screen bg-white text-slate-900">
        <div className="mx-auto max-w-3xl px-6 py-14">
          <p className="text-sm font-medium text-slate-600">Slottick • Local services</p>

          <h1 className="mt-2 text-4xl font-bold tracking-tight">{mainHeading}</h1>

          <p className="mt-4 text-lg text-slate-600">
            Browse trusted local businesses, compare services, and book instantly with real availability.
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
              <p key={idx} className="text-slate-700 leading-relaxed">
                {p}
              </p>
            ))}
          </section>

          <section className="mt-10 rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <h2 className="text-xl font-semibold">How to find the right option</h2>
            <ul className="mt-4 list-disc space-y-2 pl-6 text-slate-700">
              {bullets.map((b, idx) => (
                <li key={idx}>{b}</li>
              ))}
            </ul>
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
              Go straight to the marketplace and filter by category and city.
            </p>
            <div className="mt-5">
              <Link className="font-semibold underline" href={exploreHref}>
                Explore {intentTitle.toLowerCase()} in {cityName}
              </Link>
            </div>
          </section>

          {/* Strong internal links */}
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
