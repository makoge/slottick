import type { Metadata } from "next";
import Link from "next/link";
import { TARGET_COUNTRIES, TARGET_CATEGORIES } from "@/lib/seo/targets";
import { slugify } from "@/lib/seo/slug";

type Params = {
  locale: string;
  countrySlug: string;
  citySlug: string;
  categorySlug: string;
};

function findCountry(countrySlug: string) {
  return TARGET_COUNTRIES.find((c) => c.slug === countrySlug) || null;
}

function findCity(country: NonNullable<ReturnType<typeof findCountry>>, citySlug: string) {
  return country.cities.find((c) => slugify(c) === citySlug) || null;
}

function findCategory(categorySlug: string) {
  return (
    TARGET_CATEGORIES.find((c) => slugify(c) === categorySlug) || null
  );
}

export async function generateStaticParams() {
  const params: Array<Omit<Params, "locale">> = [];

  for (const country of TARGET_COUNTRIES) {
    for (const city of country.cities) {
      for (const category of TARGET_CATEGORIES) {
        params.push({
          countrySlug: country.slug,
          citySlug: slugify(city),
          categorySlug: slugify(category),
        });
      }
    }
  }

  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { locale, countrySlug, citySlug, categorySlug } = await params;

  const siteName = "Slottick";
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://slottick.com";

  const country = findCountry(countrySlug);
  const city = country ? findCity(country, citySlug) : null;
  const category = findCategory(categorySlug);

  if (!country || !city || !category) {
    return { robots: { index: false, follow: false } };
  }

  const title = `${category} in ${city} | Book services on Slottick`;
  const description = `Find and book ${category.toLowerCase()} in ${city}, ${country.name}. Compare businesses and book instantly through Slottick.`;

  const canonical = `${baseUrl}/${locale}/seo/${countrySlug}/${citySlug}/${categorySlug}`;

  return {
    metadataBase: new URL(baseUrl),
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "article",
      url: canonical,
      siteName,
      title,
      description,
      locale,
      images: [{ url: "/og.png", width: 1200, height: 630, alt: siteName }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og.png"],
    },
  };
}

export default async function SeoLandingPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale, countrySlug, citySlug, categorySlug } = await params;

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

  // ✅ This is the MONEY link (passes intent into Explore)
  const exploreHref = `/${locale}/explore?city=${encodeURIComponent(city)}&category=${encodeURIComponent(
    category
  )}`;

  // ✅ Auto-link blocks
  const siblingCategories = TARGET_CATEGORIES.filter((c) => c !== category).slice(0, 8);
  const siblingCities = country.cities.filter((c) => c !== city).slice(0, 8);

  // ✅ FAQ schema (indexable)
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `How do I book ${category.toLowerCase()} in ${city}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Use the Slottick marketplace to filter by ${city} and ${category}. Choose a business, pick a time, and confirm your booking.`,
        },
      },
      {
        "@type": "Question",
        name: `Are there last-minute appointments available in ${city}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Yes—availability depends on each business. Slottick shows real-time openings based on the provider’s schedule.`,
        },
      },
      {
        "@type": "Question",
        name: `Can I compare businesses before booking?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Yes. Browse listings, check category/city info, and then book through the business booking page.`,
        },
      },
    ],
  };

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <p className="text-sm font-medium text-slate-600">Slottick • Local services</p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          {category} in {city}
        </h1>

        <p className="mt-4 text-slate-600">
          Looking for {category.toLowerCase()} in {city}, {country.name}? Browse businesses,
          check availability, and book instantly—no DMs, no back-and-forth.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={exploreHref}
            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
          >
            View {category} in {city}
          </Link>

          <Link
            href={`/${locale}/explore`}
            className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold hover:bg-slate-50"
          >
            Open marketplace
          </Link>
        </div>

        {/* ✅ Auto-link: city ↔ category ↔ explore */}
        <section className="mt-10 rounded-2xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold">Popular in {city}</h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {siblingCategories.map((c) => {
              const href = `/${locale}/seo/${countrySlug}/${citySlug}/${slugify(c)}`;
              return (
                <Link key={c} href={href} className="text-sm underline text-slate-700 hover:text-slate-900">
                  {c} in {city}
                </Link>
              );
            })}
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold">{category} in other cities</h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {siblingCities.map((ct) => {
              const href = `/${locale}/seo/${countrySlug}/${slugify(ct)}/${categorySlug}`;
              return (
                <Link key={ct} href={href} className="text-sm underline text-slate-700 hover:text-slate-900">
                  {category} in {ct}
                </Link>
              );
            })}
          </div>
        </section>
      </div>

      {/* ✅ FAQ schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
    </main>
  );
}
