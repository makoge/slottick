import type { Metadata } from "next";
import Link from "next/link";
import { KEYWORD_PAGES } from "@/lib/seo/keywords";

type Params = { locale: string; slug: string };

export async function generateStaticParams() {
  return KEYWORD_PAGES.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
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
  };
}

export default async function Page({ params }: { params: Promise<Params> }) {
  const { locale, slug } = await params;
  const p = KEYWORD_PAGES.find((x) => x.slug === slug);

  if (!p) return null;

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
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <p className="text-sm font-medium text-slate-600">Slottick • Local search</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">{p.title}</h1>
        <p className="mt-4 text-slate-600">{p.intro}</p>

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
        </div>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
    </main>
  );
}
