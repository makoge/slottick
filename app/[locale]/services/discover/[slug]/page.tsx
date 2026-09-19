// app/[locale]/services/discover/[slug]/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { locales } from "@/lib/i18n";
import { KEYWORD_PAGES } from "@/lib/seo/keywords";

type Params = { locale: string; slug: string };

function baseUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://slottick.com").replace(
    /\/$/,
    "",
  );
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
        "Pick a slot where you’re not rushing — the best cuts need buffer time.",
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
        "Braiding is time-heavy — book a service that matches hair length + style.",
        "Use notes to mention length, parting style, and whether you’re bringing hair.",
        "Choose earlier slots if the style can take multiple hours.",
      ],
    };
  }

  if (t.includes("nail") || t.includes("manicure") || t.includes("pedicure")) {
    return {
      heading: "Booking tips",
      bullets: [
        "If you need removal + new set, book a longer slot (removal adds time).",
        "Choose gel vs acrylic based on durability, then confirm the service name.",
        "If you’re doing nail art, add it as a service or note it to avoid timing issues.",
      ],
    };
  }

  return {
    heading: "Booking tips",
    bullets: [
      "Pick a service that matches the real duration so your slot is protected.",
      "Use notes to mention preferences (style, hair length, allergies, etc.).",
      "Book providers with clear service listings and consistent availability.",
    ],
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
  params,
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
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
    openGraph: {
      type: "article",
      url: canonical,
      siteName: "Slottick",
      title: p.title,
      description: p.intro,
      locale: ogLocale(locale),
      images: [{ url: ogImg, width: 1200, height: 630, alt: "Slottick" }],
    },
    twitter: {
      card: "summary_large_image",
      title: p.title,
      description: p.intro,
      images: [ogImg],
    },
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

  const sameCityLinks = KEYWORD_PAGES.filter(
    (x) => x.city === p.city && x.slug !== p.slug,
  ).slice(0, 10);
  const otherCityLinks = KEYWORD_PAGES.filter((x) => x.city !== p.city).slice(
    0,
    6,
  );

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: p.faqs.map(([q, a]) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
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
        name: "Discover",
        item: `${urlBase}/${locale}/services/discover`,
      },
      { "@type": "ListItem", position: 4, name: p.title, item: canonical },
    ],
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
      logo: { "@type": "ImageObject", url: `${urlBase}/og.png` },
    },
    about: [p.explore?.q || p.title, p.city, "Online booking"],
    isPartOf: { "@type": "WebSite", name: "Slottick", url: urlBase },
  };

  return (
    <div className="w-full">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* HERO CARD */}
        <section className="relative overflow-hidden rounded-3xl border border-slate-400/40 bg-white/70 p-6 shadow-md backdrop-blur-xl sm:p-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-lime-300/80 bg-lime-100 px-3 py-1 font-mono text-xs font-semibold uppercase tracking-wider text-lime-950">
              <span className="h-1.5 w-1.5 rounded-full bg-lime-700" />
              Discover Services
            </span>
            <span className="rounded-full border border-slate-300/80 bg-white/80 px-3 py-1 font-mono text-xs font-medium text-slate-700">
              📍 {p.city}
            </span>
          </div>

          <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            {p.title}
          </h1>

          <p className="mt-3 text-base leading-relaxed text-slate-700 sm:text-lg">
            {p.intro}
          </p>

          <div className="mt-5 space-y-2.5 rounded-2xl border border-slate-300/70 bg-slate-100/70 p-4 text-sm leading-relaxed text-slate-700">
            <p>
              Browse services in{" "}
              <span className="font-semibold text-slate-900">{p.city}</span> and
              book directly without back-and-forth messages. Provider schedules
              update in real time.
            </p>
            <p>
              Filter by category, compare options, and pick a time slot that
              matches your routine.
            </p>
          </div>

          {/* ACTION BUTTONS */}
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              href={exploreHref}
              className="inline-flex items-center justify-center rounded-2xl border border-lime-300/80 bg-lime-100 px-5 py-3 text-sm font-bold text-lime-950 shadow-xs transition-all hover:bg-lime-200 active:scale-95"
            >
              See availability in Explore
            </Link>

            <Link
              href={`/${locale}/explore`}
              className="inline-flex items-center justify-center rounded-2xl border border-slate-400/60 bg-white/80 px-5 py-3 text-sm font-semibold text-slate-800 shadow-xs backdrop-blur-md transition-all hover:bg-white hover:text-slate-950 active:scale-95"
            >
              Open marketplace
            </Link>

            <Link
              href={`/${locale}/register`}
              className="inline-flex items-center justify-center rounded-2xl border border-slate-400/60 bg-white/60 px-5 py-3 text-sm font-semibold text-slate-700 shadow-xs backdrop-blur-md transition-all hover:bg-white hover:text-slate-950 active:scale-95"
            >
              List your business
            </Link>
          </div>
        </section>

        {/* BOOKING TIPS PANEL */}
        <section className="rounded-3xl border border-slate-400/40 bg-white/65 p-6 shadow-sm backdrop-blur-xl sm:p-8">
          <div className="flex items-center gap-2.5 border-b border-slate-300/70 pb-4">
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

        {/* SAME CITY LINKS */}
        {sameCityLinks.length > 0 ? (
          <section className="rounded-3xl border border-slate-400/40 bg-white/60 p-6 shadow-sm backdrop-blur-xl sm:p-8">
            <div className="flex items-center justify-between border-b border-slate-300/70 pb-3">
              <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-600">
                More in {p.city}
              </h2>
              <span className="font-mono text-xs text-slate-500">
                {sameCityLinks.length} options
              </span>
            </div>

            <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
              {sameCityLinks.map((x) => (
                <Link
                  key={x.slug}
                  href={`/${locale}/services/discover/${x.slug}`}
                  className="group flex items-center justify-between rounded-xl border border-slate-300/60 bg-white/70 px-4 py-3 text-sm font-medium text-slate-800 shadow-xs transition-all hover:border-lime-300/80 hover:bg-lime-50/50"
                >
                  <span className="truncate group-hover:text-slate-950">
                    {x.title}
                  </span>
                  <span className="text-xs text-slate-400 transition-transform group-hover:translate-x-0.5">
                    →
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {/* OTHER CITIES LINKS */}
        {otherCityLinks.length > 0 ? (
          <section className="rounded-3xl border border-slate-400/40 bg-white/60 p-6 shadow-sm backdrop-blur-xl sm:p-8">
            <h2 className="border-b border-slate-300/70 pb-3 font-mono text-xs font-bold uppercase tracking-wider text-slate-600">
              Popular searches
            </h2>
            <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
              {otherCityLinks.map((x) => (
                <Link
                  key={x.slug}
                  href={`/${locale}/services/discover/${x.slug}`}
                  className="group flex items-center justify-between rounded-xl border border-slate-300/60 bg-white/70 px-4 py-3 text-sm font-medium text-slate-800 shadow-xs transition-all hover:border-lime-300/80 hover:bg-lime-50/50"
                >
                  <span className="truncate group-hover:text-slate-950">
                    {x.title}
                  </span>
                  <span className="text-xs text-slate-400 transition-transform group-hover:translate-x-0.5">
                    →
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {/* BREADCRUMB & FOOTNOTE NAV */}
        <nav className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-400/30 bg-white/40 px-4 py-3 font-mono text-xs text-slate-600 backdrop-blur-md">
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

        {/* STRUCTURED DATA */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
        />
      </div>
    </div>
  );
}
