import type { Metadata } from "next";
import { notFound /*, redirect*/ } from "next/navigation";

function envBaseUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://slottick.com").replace(/\/$/, "");
}

function normalize(s: unknown) {
  return String(s ?? "").trim();
}

function ogLocale(locale: string) {
  const map: Record<string, string> = { en: "en_US", et: "et_EE" };
  return map[locale] ?? undefined;
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string; category: string; city: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, category, city, slug } = await params;

  const baseUrl = envBaseUrl();
  const bookingUrl = `${baseUrl}/${locale}/book/${encodeURIComponent(slug)}`;
  const landingUrl = `${baseUrl}/${locale}/explore/${encodeURIComponent(category)}/${encodeURIComponent(
    city
  )}/${encodeURIComponent(slug)}`;

  // Fetch minimal info for a good title/description (don’t crash build if it fails)
  let name = "Book now";
  let logoUrl: string | undefined;

  try {
    const res = await fetch(`${baseUrl}/api/businesses/${encodeURIComponent(slug)}`, {
      cache: "no-store"
    });
    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      name = normalize(data?.business?.name) || name;
      const lu = normalize(data?.business?.logoUrl);
      if (lu) logoUrl = lu;
    }
  } catch {
    // ignore
  }

  const title = `${name} — ${normalize(category)} in ${normalize(city)}`;
  const description = `Book ${name} in ${normalize(city)}. Check real availability and reserve your slot online.`;

  return {
    title,
    description,
    alternates: {
      canonical: bookingUrl // ✅ important: avoid duplicate SEO URLs
    },
    robots: { index: true, follow: true },
    openGraph: {
      type: "website",
      url: landingUrl,
      title,
      description,
      locale: ogLocale(locale),
      images: logoUrl
        ? [{ url: logoUrl, width: 800, height: 800, alt: name }]
        : [{ url: `${baseUrl}/og.png`, width: 1200, height: 630, alt: "Slottick" }]
    }
  };
}

export default async function Page({
  params
}: {
  params: Promise<{
    locale: string;
    category: string;
    city: string;
    slug: string;
  }>;
}) {
  const { locale, category, city, slug } = await params;

  const baseUrl = envBaseUrl();
  const bookingUrl = `${baseUrl}/${locale}/book/${encodeURIComponent(slug)}`;

  const res = await fetch(`${baseUrl}/api/businesses/${encodeURIComponent(slug)}`, {
    cache: "no-store"
  });

  if (!res.ok) notFound();
  const data = await res.json().catch(() => ({}));
  const b = data?.business;
  if (!b) notFound();

  // 🔒 sanity check: prevents spam URLs ranking
  const ok =
    normalize(b.slug).toLowerCase() === normalize(slug).toLowerCase() &&
    normalize(b.city).toLowerCase() === normalize(city).toLowerCase() &&
    // if you renamed to serviceCategory/industry, adjust this line:
    normalize(b.category).toLowerCase() === normalize(category).toLowerCase();

  if (!ok) notFound();

  // ✅ JSON-LD (LocalBusiness)
  const localBusinessJsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: normalize(b.name),
    url: bookingUrl,
    image: b.logoUrl ? [normalize(b.logoUrl)] : undefined,
    address: {
      "@type": "PostalAddress",
      addressLocality: normalize(b.city),
      addressCountry: normalize(b.country)
    }
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Explore", item: `${baseUrl}/${locale}/explore` },
      {
        "@type": "ListItem",
        position: 2,
        name: normalize(category),
        item: `${baseUrl}/${locale}/explore/${encodeURIComponent(category)}`
      },
      {
        "@type": "ListItem",
        position: 3,
        name: normalize(city),
        item: `${baseUrl}/${locale}/explore/${encodeURIComponent(category)}/${encodeURIComponent(city)}`
      },
      { "@type": "ListItem", position: 4, name: normalize(b.name), item: bookingUrl }
    ]
  };

  // My opinion: redirecting is clean UX, but keep HTML for SEO.
  // If you want redirect, uncomment:
  // redirect(`/${locale}/book/${slug}`);

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-bold tracking-tight">{normalize(b.name)}</h1>
        <p className="mt-3 text-slate-600">
          Book {normalize(b.name)} in {normalize(b.city)}.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href={`/${locale}/book/${encodeURIComponent(slug)}`}
            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Go to booking
          </a>

          <a
            href={`/${locale}/explore`}
            className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
          >
            Browse more
          </a>
        </div>

        <p className="mt-8 text-sm text-slate-500">
          Tip: This page exists to help you discover businesses via search. Booking happens on the official booking
          page.
        </p>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
        />
      </div>
    </main>
  );
}
