
// app/[locale]/services/discover/[slug]/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { locales } from "@/lib/i18n";
import { KEYWORD_PAGES } from "@/lib/seo/keywords";

type Params = { locale: string; slug: string };

function baseUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://slottick.com").replace(/\/$/, "");
}

function ogLocale(locale: string) {
  const map: Record<string, string> = { en: "en_US", fr: "fr_FR" };
  return map[locale];
}

function buildExplorePath(locale: string, p: (typeof KEYWORD_PAGES)[number]) {
  const qs = new URLSearchParams();
  if (p.city) qs.set("city", p.city);
  if (p.explore?.category) qs.set("category", p.explore.category);
  if (p.explore?.q) qs.set("q", p.explore.q);
  return `/${locale}/explore?${qs.toString()}`;
}

function bookingTips(title: string) {
  const t = title.toLowerCase();

  if (t.includes("barber") || t.includes("haircut") || t.includes("beard")) {
    return {
      heading: "Booking tips",
      bullets: [
        "Bring a reference photo (fade level, line-up, beard shape).",
        "If you want haircut + beard, book the longer service so timing is correct.",
        "Pick a slot where you’re not rushing — the best cuts need buffer time."
      ]
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
        "Braiding is time-heavy — book a service that matches hair length + style.",
        "Use notes to mention length, parting style, and whether you’re bringing hair.",
        "Choose earlier slots if the style can take multiple hours."
      ]
    };
  }

  if (t.includes("nail") || t.includes("manicure") || t.includes("pedicure")) {
    return {
      heading: "Booking tips",
      bullets: [
        "If you need removal + new set, book a longer slot (removal adds time).",
        "Choose gel vs acrylic based on durability, then confirm the service name.",
        "If you’re doing nail art, add it as a service or note it to avoid timing issues."
      ]
    };
  }

  return {
    heading: "Booking tips",
    bullets: [
      "Pick a service that matches the real duration so your slot is protected.",
      "Use notes to mention preferences (style, hair length, allergies, etc.).",
      "Book providers with clear service listings and consistent availability."
    ]
  };
}

export async function generateStaticParams() {
  const params: Params[] = [];
  for (const locale of locales) {
    for (const p of KEYWORD_PAGES) {
      params.push({ locale, slug: p.slug });
    }
  }
  return params;
}

export async function generateMetadata({
  params
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { locale, slug } = await params;

  const p = KEYWORD_PAGES.find((x) => x.slug === slug);
  if (!p) return { robots: { index: false, follow: false } };

  const urlBase = baseUrl();
  const canonical = `${urlBase}/${locale}/services/discover/${slug}`;
  const ogImg = `${urlBase}/og.png`;

  return {
    metadataBase: new URL(urlBase),
    title: `${p.title} | Slottick`,
    description: p.intro,
    alternates: { canonical },
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
      type: "article",
      url: canonical,
      siteName: "Slottick",
      title: p.title,
      description: p.intro,
      locale: ogLocale(locale),
      images: [{ url: ogImg, width: 1200, height: 630, alt: "Slottick" }]
    },
    twitter: {
      card: "summary_large_image",
      title: p.title,
      description: p.intro,
      images: [ogImg]
    }
  };
}

export default async function Page({ params }: { params: Promise<Params> }) {
  const { locale, slug } = await params;

  const p = KEYWORD_PAGES.find((x) => x.slug === slug);
  if (!p) notFound();

  const urlBase = baseUrl();
  const canonical = `${urlBase}/${locale}/services/discover/${slug}`;
  const exploreHref = buildExplorePath(locale, p);

  const tips = bookingTips(p.title);

  const sameCityLinks = KEYWORD_PAGES.filter((x) => x.city === p.city && x.slug !== p.slug).slice(0, 10);
  const otherCityLinks = KEYWORD_PAGES.filter((x) => x.city !== p.city).slice(0, 6);

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: p.faqs.map(([q, a]) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a }
    }))
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${urlBase}/${locale}` },
      { "@type": "ListItem", position: 2, name: "Explore", item: `${urlBase}/${locale}/explore` },
      { "@type": "ListItem", position: 3, name: "Discover", item: `${urlBase}/${locale}/services/discover` },
      { "@type": "ListItem", position: 4, name: p.title, item: canonical }
    ]
  };

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
    headline: p.title,
    description: p.intro,
    author: { "@type": "Organization", name: "Slottick" },
    publisher: {
      "@type": "Organization",
      name: "Slottick",
      logo: { "@type": "ImageObject", url: `${urlBase}/og.png` }
    },
    about: [p.explore?.q || p.title, p.city, "Online booking"],
    isPartOf: { "@type": "WebSite", name: "Slottick", url: urlBase }
  };

  return (
    <>
      <main className="min-h-screen bg-white text-slate-900">
        <div className="mx-auto max-w-4xl px-6 py-12">
          <p className="text-sm font-medium text-slate-600">Slottick • Discover</p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight">{p.title}</h1>
          <p className="mt-4 text-slate-600">{p.intro}</p>

          <div className="mt-5 space-y-3 text-slate-600">
            <p>
              Browse services in <span className="font-semibold">{p.city}</span> and book without
              back-and-forth messages. Availability updates in real time.
            </p>
            <p>
              Filter by category, compare options, and pick a time that fits your schedule. If you’re
              a business owner, you can list your service to get found.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={exploreHref}
              className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
            >
              See availability in Explore
            </Link>

            <Link
              href={`/${locale}/explore`}
              className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold hover:bg-slate-50"
            >
              Open marketplace
            </Link>

            <Link
              href={`/${locale}/register`}
              className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold hover:bg-slate-50"
            >
              List your business
            </Link>
          </div>

          <section className="mt-10 rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <h2 className="text-lg font-semibold text-slate-900">{tips.heading}</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-700">
              {tips.bullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </section>

          {sameCityLinks.length > 0 ? (
            <section className="mt-10 border-t border-slate-200 pt-6">
              <h2 className="text-sm font-semibold text-slate-900">More in {p.city}</h2>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {sameCityLinks.map((x) => (
                  <Link
                    key={x.slug}
                    href={`/${locale}/services/discover/${x.slug}`}
                    className="text-sm underline text-slate-700 hover:text-slate-900"
                  >
                    {x.title}
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          {otherCityLinks.length > 0 ? (
            <section className="mt-8 rounded-2xl border border-slate-200 p-6">
              <h2 className="text-sm font-semibold text-slate-900">Popular searches</h2>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {otherCityLinks.map((x) => (
                  <Link
                    key={x.slug}
                    href={`/${locale}/services/discover/${x.slug}`}
                    className="text-sm underline text-slate-700 hover:text-slate-900"
                  >
                    {x.title}
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

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

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      </main>
    </>
  );
}
