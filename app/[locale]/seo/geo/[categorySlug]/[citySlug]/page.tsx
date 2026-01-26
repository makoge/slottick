import type { Metadata } from "next";
import Link from "next/link";
import { locales } from "@/lib/i18n";
import { TARGET_COUNTRIES, TARGET_CATEGORIES } from "@/lib/seo/targets";
import { slugify } from "@/lib/seo/slug";

type Params = {
  locale: string;
  countrySlug: string;
  citySlug: string;
  categorySlug: string;
};

function findCountry(countrySlug: string) {
  return TARGET_COUNTRIES.find((c) => c.slug === countrySlug) ?? null;
}

function findCity(
  country: NonNullable<ReturnType<typeof findCountry>>,
  citySlug: string
) {
  return country.cities.find((c) => slugify(c) === citySlug) ?? null;
}

function findCategory(categorySlug: string) {
  return TARGET_CATEGORIES.find((c) => c.slug === categorySlug) ?? null;
}

export async function generateStaticParams() {
  const params: Params[] = [];

  for (const locale of locales) {
    for (const country of TARGET_COUNTRIES) {
      for (const city of country.cities) {
        for (const category of TARGET_CATEGORIES) {
          params.push({
            locale,
            countrySlug: country.slug,
            citySlug: slugify(city),
            categorySlug: category.slug
          });
        }
      }
    }
  }

  return params;
}

export async function generateMetadata({
  params
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { locale, countrySlug, citySlug, categorySlug } = await params;

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://slottick.com";

  const country = findCountry(countrySlug);
  const city = country ? findCity(country, citySlug) : null;
  const category = findCategory(categorySlug);

  if (!country || !city || !category) {
    return { robots: { index: false, follow: false } };
  }

  const categoryLabel = category.label;

  const title = `${categoryLabel} in ${city} | Book services on Slottick`;
  const description = `Find and book ${categoryLabel.toLowerCase()} in ${city}, ${country.name}. Compare businesses, check real availability, and book instantly on Slottick.`;

  const canonical = `${baseUrl}/${locale}/seo/${countrySlug}/${citySlug}/${categorySlug}`;

  return {
    metadataBase: new URL(baseUrl),
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

export default async function SeoLandingPage({
  params
}: {
  params: Promise<Params>;
}) {
  const { locale, countrySlug, citySlug, categorySlug } = await params;

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://slottick.com";

  const country = findCountry(countrySlug);
  const city = country ? findCity(country, citySlug) : null;
  const category = findCategory(categorySlug);

  if (!country || !city || !category) {
    return (
      <main className="min-h-screen bg-white text-slate-900">
        <div className="mx-auto max-w-3xl px-6 py-12">
          <h1 className="text-2xl font-bold">Page not found</h1>
        </div>
      </main>
    );
  }

  const categoryLabel = category.label;

  const exploreHref = `/${locale}/explore?city=${encodeURIComponent(
    city
  )}&category=${encodeURIComponent(categoryLabel)}`;

  const siblingCategories = TARGET_CATEGORIES.filter(
    (c) => c.slug !== category.slug
  ).slice(0, 10);

  const siblingCities = country.cities.filter((c) => c !== city).slice(0, 10);

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `How do I book ${categoryLabel.toLowerCase()} in ${city}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Use Slottick to filter by ${city} and ${categoryLabel}, pick a business, choose a time slot, and confirm instantly.`
        }
      },
      {
        "@type": "Question",
        name: `Are there last-minute appointments available in ${city}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Sometimes, availability depends on each business. Slottick shows real-time openings based on the provider’s schedule.`
        }
      },
      {
        "@type": "Question",
        name: `Can I compare businesses before booking?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Yes. Browse listings, check city/category information, then book directly through the business booking page.`
        }
      }
    ]
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${baseUrl}/${locale}` },
      { "@type": "ListItem", position: 2, name: "Explore", item: `${baseUrl}/${locale}/explore` },
      {
        "@type": "ListItem",
        position: 3,
        name: `${categoryLabel} in ${city}`,
        item: `${baseUrl}/${locale}/seo/${countrySlug}/${citySlug}/${categorySlug}`
      }
    ]
  };

  return (
    <>
      <main className="min-h-screen bg-white text-slate-900">
        <div className="mx-auto max-w-4xl px-6 py-12">
          <p className="text-sm font-medium text-slate-600">Slottick • Local services</p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            {categoryLabel} in {city}
          </h1>

          {/* stronger body content (not thin) */}
          <p className="mt-4 text-slate-600">
            Looking for {categoryLabel.toLowerCase()} in {city}, {country.name}? Slottick helps you
            find trusted local businesses, compare services, and book instantly with real availability.
          </p>

          <p className="mt-3 text-slate-600">
            This is ideal if you want to avoid back-and-forth messages, double booking, or wasted time.
            Filter by city and category, then pick a time slot that fits the provider’s schedule.
          </p>

          <ul className="mt-5 list-disc space-y-2 pl-6 text-slate-700">
            <li>Browse {categoryLabel.toLowerCase()} options in {city}</li>
            <li>Check real availability (no guessing)</li>
            <li>Book in minutes and get confirmation</li>
          </ul>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={exploreHref}
              className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
            >
              View {categoryLabel} in {city}
            </Link>

            <Link
              href={`/${locale}/explore`}
              className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold hover:bg-slate-50"
            >
              Open marketplace
            </Link>
          </div>

          <section className="mt-10 rounded-2xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold">Popular in {city}</h2>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {siblingCategories.map((c) => {
                const href = `/${locale}/seo/${countrySlug}/${citySlug}/${c.slug}`;
                return (
                  <Link
                    key={c.slug}
                    href={href}
                    className="text-sm underline text-slate-700 hover:text-slate-900"
                  >
                    {c.label} in {city}
                  </Link>
                );
              })}
            </div>
          </section>

          <section className="mt-8 rounded-2xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold">{categoryLabel} in other cities</h2>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {siblingCities.map((ct) => {
                const href = `/${locale}/seo/${countrySlug}/${slugify(ct)}/${categorySlug}`;
                return (
                  <Link
                    key={ct}
                    href={href}
                    className="text-sm underline text-slate-700 hover:text-slate-900"
                  >
                    {categoryLabel} in {ct}
                  </Link>
                );
              })}
            </div>
          </section>

          {/* extra internal links */}
          <nav className="mt-10 text-sm text-slate-600">
            <Link className="underline" href={`/${locale}`}>Home</Link> •{" "}
            <Link className="underline" href={`/${locale}/explore`}>Explore</Link> •{" "}
            <Link className="underline" href={`/${locale}/register`}>List your business</Link>
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
