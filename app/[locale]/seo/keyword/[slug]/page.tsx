import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { locales } from "@/lib/i18n";
import { KEYWORD_PAGES } from "@/lib/seo/keywords";

type Params = { locale: string; slug: string };

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

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://slottick.com";

  const canonical = `${baseUrl}/${locale}/seo/keyword/${slug}`;

  return {
    metadataBase: new URL(baseUrl),
    title: `${p.title} | Slottick`,
    description: p.intro,
    alternates: { canonical },
    robots: { index: true, follow: true },
    openGraph: {
      type: "article",
      url: canonical,
      siteName: "Slottick",
      title: p.title,
      description: p.intro,
      locale,
      images: [{ url: "/og.png", width: 1200, height: 630, alt: "Slottick" }]
    },
    twitter: {
      card: "summary_large_image",
      title: p.title,
      description: p.intro,
      images: ["/og.png"]
    }
  };
}

export default async function Page({ params }: { params: Promise<Params> }) {
  const { locale, slug } = await params;
  const p = KEYWORD_PAGES.find((x) => x.slug === slug);
  if (!p) notFound();

  const exploreHref = `/${locale}/explore?city=${encodeURIComponent(
    p.city
  )}&category=${encodeURIComponent(p.explore.category)}&q=${encodeURIComponent(
    p.explore.q
  )}`;

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: p.faqs.map(([q, a]) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a }
    }))
  };

  // optional but strong
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `/${locale}` },
      { "@type": "ListItem", position: 2, name: "Explore", item: `/${locale}/explore` },
      { "@type": "ListItem", position: 3, name: p.title, item: `/${locale}/seo/keyword/${slug}` }
    ]
  };

  return (
    <>
      <main className="min-h-screen bg-white text-slate-900">
        <div className="mx-auto max-w-4xl px-6 py-12">
          <p className="text-sm font-medium text-slate-600">Slottick • Local search</p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight">{p.title}</h1>
          <p className="mt-4 text-slate-600">{p.intro}</p>

          {/* my opinion: add 2 small paragraphs to avoid thin content */}
          <div className="mt-5 space-y-3 text-slate-600">
            <p>
              Use Slottick to discover services in {p.city} and book without back-and-forth messages.
              Availability updates in real time so you don’t waste time guessing.
            </p>
            <p>
              Filter by category, compare options, and pick a time that fits your schedule.
              If you’re a business owner, you can also list your service to get found.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={exploreHref}
              className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
            >
              See results in Explore
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
        </div>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
        />
      </main>
    </>
  );
}

