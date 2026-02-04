// app/[locale]/services/[countrySlug]/[citySlug]/[categorySlug]/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { locales } from "@/lib/i18n";
import { TARGET_COUNTRIES, TARGET_CATEGORIES } from "@/lib/seo/targets";
import { slugify } from "@/lib/seo/slug";

type Params = {
  locale: string;
  countrySlug: string;
  citySlug: string;
  categorySlug: string;
};

function baseUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://slottick.com").replace(/\/$/, "");
}

// Optional OG locale mapping (keep only what you support)
function ogLocale(locale: string) {
  const map: Record<string, string> = { en: "en_US", fr: "fr_FR" };
  return map[locale];
}

function findCountry(countrySlug: string) {
  return TARGET_COUNTRIES.find((c) => c.slug === countrySlug) ?? null;
}

function findCity(country: NonNullable<ReturnType<typeof findCountry>>, citySlug: string) {
  return country.cities.find((c) => slugify(c) === citySlug) ?? null;
}

function findCategory(categorySlug: string) {
  return TARGET_CATEGORIES.find((c) => c.slug === categorySlug) ?? null;
}

// Map category slug -> Explore "category" param
function exploreCategoryParam(categorySlug: string) {
  const map: Record<string, string> = {
    "beauty-salons": "Other",
    "lash-techs": "Lash",
    "hair-braiders": "Hair",
    barbers: "Barber",
    "nail-salons": "Nails",
    massage: "Massage"
  };
  return map[categorySlug] ?? "Other";
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

  const urlBase = baseUrl();
  const country = findCountry(countrySlug);
  const city = country ? findCity(country, citySlug) : null;
  const category = findCategory(categorySlug);

  if (!country || !city || !category) {
    return { robots: { index: false, follow: false } };
  }

  const categoryLabel = category.label;
  const title = `${categoryLabel} in ${city} | Slottick`;
  const description = `Find and book ${categoryLabel.toLowerCase()} in ${city}, ${country.name}. Compare businesses, check real availability, and book instantly.`;

  const canonical = `${urlBase}/${locale}/services/${countrySlug}/${citySlug}/${categorySlug}`;
  const languages = Object.fromEntries(
    locales.map((l) => [l, `${urlBase}/${l}/services/${countrySlug}/${citySlug}/${categorySlug}`])
  );

  const ogImg = `${urlBase}/og.png`;

  return {
    metadataBase: new URL(urlBase),
    title,
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
      title,
      description,
      locale: ogLocale(locale),
      images: [{ url: ogImg, width: 1200, height: 630, alt: "Slottick" }]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImg]
    }
  };
}

export default async function ServicesLandingPage({
  params
}: {
  params: Promise<Params>;
}) {
  const { locale, countrySlug, citySlug, categorySlug } = await params;

  const urlBase = baseUrl();
  const country = findCountry(countrySlug);
  const city = country ? findCity(country, citySlug) : null;
  const category = findCategory(categorySlug);

  if (!country || !city || !category) notFound();

  const categoryLabel = category.label;
  const canonical = `${urlBase}/${locale}/services/${countrySlug}/${citySlug}/${categorySlug}`;

  // Explore (absolute for JSON-LD; use relative in Link)
  const exploreUrl = new URL(`/${locale}/explore`, urlBase);
  exploreUrl.searchParams.set("city", city);
  exploreUrl.searchParams.set("category", exploreCategoryParam(categorySlug));

  const siblingCategories = TARGET_CATEGORIES.filter((c) => c.slug !== category.slug).slice(0, 10);
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
          text: `Open Slottick, filter by ${city} and ${categoryLabel}, pick a business, choose an available slot, and confirm instantly.`
        }
      },
      {
        "@type": "Question",
        name: `Are last-minute appointments available in ${city}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Sometimes. Availability depends on each provider, and Slottick only shows time slots that are actually free.`
        }
      },
      {
        "@type": "Question",
        name: `Can I compare businesses before booking?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Yes. Compare services and availability, then book directly from the business page.`
        }
      }
    ]
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${urlBase}/${locale}` },
      { "@type": "ListItem", position: 2, name: "Explore", item: `${urlBase}/${locale}/explore` },
      { "@type": "ListItem", position: 3, name: `${categoryLabel} in ${city}`, item: canonical }
    ]
  };

  return (
    <>
      <main className="min-h-screen bg-white text-slate-900">
        <div className="mx-auto max-w-4xl px-6 py-12">
          <p className="text-sm font-medium text-slate-600">Slottick • Services</p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            {categoryLabel} in {city}
          </h1>

          <p className="mt-4 text-slate-600">
            Find {categoryLabel.toLowerCase()} in {city}, {country.name}. Compare services and durations,
            then book instantly using real availability.
          </p>

          <p className="mt-3 text-slate-600">
            My opinion: this page will rank better if it feels like a mini-guide, not a doorway page.
            Keep the helpful “how to choose” text and internal links — it’s the difference.
          </p>

          <ul className="mt-5 list-disc space-y-2 pl-6 text-slate-700">
            <li>See real available slots</li>
            <li>Compare services, durations, pricing where listed</li>
            <li>Book fast and get confirmation</li>
          </ul>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={exploreUrl.toString().replace(urlBase, "")}
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
              {siblingCategories.map((c) => (
                <Link
                  key={c.slug}
                  href={`/${locale}/services/${countrySlug}/${citySlug}/${c.slug}`}
                  className="text-sm underline text-slate-700 hover:text-slate-900"
                >
                  {c.label} in {city}
                </Link>
              ))}
            </div>
          </section>

          <section className="mt-8 rounded-2xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold">{categoryLabel} in other cities</h2>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {siblingCities.map((ct) => (
                <Link
                  key={ct}
                  href={`/${locale}/services/${countrySlug}/${slugify(ct)}/${categorySlug}`}
                  className="text-sm underline text-slate-700 hover:text-slate-900"
                >
                  {categoryLabel} in {ct}
                </Link>
              ))}
            </div>
          </section>

          <nav className="mt-10 text-sm text-slate-600">
            <Link className="underline" href={`/${locale}`}>Home</Link> •{" "}
            <Link className="underline" href={`/${locale}/explore`}>Explore</Link> •{" "}
            <Link className="underline" href={`/${locale}/register`}>List your business</Link>
          </nav>
        </div>
      </main>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
    </>
  );
}
