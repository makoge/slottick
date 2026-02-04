// app/[locale]/guides/[locationSlug]/[serviceSlug]/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { locales } from "@/lib/i18n";
import {
  guidePairs,
  findLocation,
  findService,
  prettyLocationName,
  safeInternalSlug,
  GUIDE_SERVICES
} from "@/lib/seo/guides";

type Params = { locale: string; locationSlug: string; serviceSlug: string };

function baseUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://slottick.com").replace(/\/$/, "");
}
function ogLocale(locale: string) {
  const map: Record<string, string> = { en: "en_US", fr: "fr_FR" };
  return map[locale];
}

export async function generateStaticParams() {
  const params: Params[] = [];
  for (const locale of locales) {
    for (const p of guidePairs()) {
      params.push({ locale, ...p });
    }
  }
  return params;
}

function buildExploreUrl(urlBase: string, locale: string, city?: string, category?: string, q?: string) {
  const u = new URL(`/${locale}/explore`, urlBase);
  if (city) u.searchParams.set("city", city);
  if (category) u.searchParams.set("category", category);
  if (q) u.searchParams.set("q", q);
  return u.toString();
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { locale, locationSlug, serviceSlug } = await params;

  const loc = findLocation(locationSlug);
  const svc = findService(serviceSlug);
  if (!loc || !svc) return { robots: { index: false, follow: false } };

  const urlBase = baseUrl();
  const canonical = `${urlBase}/${locale}/guides/${locationSlug}/${serviceSlug}`;

  const title = svc.headlineTpl(loc.name);
  const description = svc.introTpl(loc.name);
  const ogImg = `${urlBase}/og.png`;

  const languages = Object.fromEntries(
    locales.map((l) => [l, `${urlBase}/${l}/guides/${locationSlug}/${serviceSlug}`])
  );

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
      type: "article",
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

export default async function Page({ params }: { params: Promise<Params> }) {
  const { locale, locationSlug, serviceSlug } = await params;

  const loc = findLocation(locationSlug);
  const svc = findService(serviceSlug);
  if (!loc || !svc) notFound();

  const urlBase = baseUrl();
  const canonical = `${urlBase}/${locale}/guides/${locationSlug}/${serviceSlug}`;

  const locationPretty = prettyLocationName(loc);
  const exploreUrl = buildExploreUrl(
    urlBase,
    locale,
    loc.exploreCity ?? loc.name,
    svc.exploreCategory, // remove if not fully supported
    svc.exploreQ
  );

  const sections = svc.sectionsTpl(loc.name);
  const faqs = svc.faqsTpl(loc.name);

  // internal links: same location, other services
  const relatedServices = svc.relatedServiceSlugs
    .map((slug) => {
      const match = GUIDE_SERVICES.find((x) => x.slug === slug);
      return match ? { slug: match.slug, label: match.label } : null;
    })
    .filter(Boolean) as Array<{ slug: string; label: string }>;

  const otherServicesSameLocation = GUIDE_SERVICES
    .filter((x) => x.slug !== svc.slug)
    .slice(0, 8)
    .map((x) => ({ slug: x.slug, label: x.label }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
    headline: svc.headlineTpl(loc.name),
    description: svc.introTpl(loc.name),
    author: { "@type": "Organization", name: "Slottick" },
    publisher: {
      "@type": "Organization",
      name: "Slottick",
      logo: { "@type": "ImageObject", url: `${urlBase}/og.png` }
    },
    about: [svc.label, loc.name, "Online booking"],
    isPartOf: { "@type": "WebSite", name: "Slottick", url: urlBase }
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a }
    }))
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${urlBase}/${locale}` },
      { "@type": "ListItem", position: 2, name: "Explore", item: `${urlBase}/${locale}/explore` },
      {
        "@type": "ListItem",
        position: 3,
        name: `${svc.label} in ${loc.name}`,
        item: canonical
      }
    ]
  };

  return (
    <>
      <main className="min-h-screen bg-white text-slate-900">
        <div className="mx-auto max-w-3xl px-6 py-12">
          <header className="mb-10">
            <p className="text-sm font-medium text-slate-600">Slottick • Guides</p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight">
              {svc.label} in {loc.name}
            </h1>

            <p className="mt-3 text-slate-600">{svc.introTpl(loc.name)}</p>

            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={exploreUrl}
                className="inline-flex rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Browse {svc.label.toLowerCase()} in {loc.name}
              </a>

              <Link
                href={`/${locale}/explore`}
                className="inline-flex rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold hover:bg-slate-50"
              >
                Open marketplace
              </Link>

              <Link
                href={`/${locale}/register`}
                className="inline-flex rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold hover:bg-slate-50"
              >
                List your business
              </Link>
            </div>

            <p className="mt-5 text-sm text-slate-500">
              Location: <span className="font-semibold text-slate-700">{locationPretty}</span>
            </p>
          </header>

          <section className="space-y-10">
            {sections.map((s) => (
              <section key={safeInternalSlug(s.h)}>
                <h2 className="text-xl font-semibold">{s.h}</h2>

                {Array.isArray(s.p) ? (
                  <ul className="mt-3 list-disc space-y-1 pl-5 text-slate-600">
                    {s.p.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-slate-600">{s.p}</p>
                )}
              </section>
            ))}
          </section>

          {/* FAQ */}
          <section className="mt-12">
            <h2 className="text-2xl font-semibold">FAQ</h2>
            <div className="mt-4 space-y-4">
              {faqs.map((f) => (
                <div key={f.q} className="rounded-2xl border border-slate-200 p-5">
                  <div className="font-semibold">{f.q}</div>
                  <div className="mt-2 text-slate-700">{f.a}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Internal links */}
          <section className="mt-12 rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <h2 className="text-lg font-semibold">Related guides</h2>

            {relatedServices.length > 0 ? (
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {relatedServices.map((r) => (
                  <Link
                    key={r.slug}
                    href={`/${locale}/guides/${locationSlug}/${r.slug}`}
                    className="text-sm font-semibold underline text-slate-700 hover:text-slate-900"
                  >
                    {r.label} in {loc.name}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-600">
                Browse more services in {loc.name} below.
              </p>
            )}

            <h3 className="mt-6 text-sm font-semibold text-slate-700">
              More services in {loc.name}
            </h3>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {otherServicesSameLocation.map((x) => (
                <Link
                  key={x.slug}
                  href={`/${locale}/guides/${locationSlug}/${x.slug}`}
                  className="text-sm underline text-slate-700 hover:text-slate-900"
                >
                  {x.label} in {loc.name}
                </Link>
              ))}
            </div>
          </section>

          <nav className="mt-10 text-sm text-slate-600">
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

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
    </>
  );
}
