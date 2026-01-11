import type { Metadata } from "next";
import Link from "next/link";

type Params = { locale: string };

export async function generateMetadata({
  params
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { locale } = await params;

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://slottick.com";

  const canonical = `${baseUrl}/${locale}/guides/bristol-beauty-salons`;

  const title = "Bristol Beauty Salons – Book trusted beauty services online";
  const description =
    "Find Bristol beauty salons and book services online. Compare popular treatments, understand pricing expectations, and discover businesses with real availability.";

  return {
    metadataBase: new URL(baseUrl),
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "article",
      url: canonical,
      title,
      description,
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

export default async function Page({ params }: { params: Promise<Params> }) {
  const { locale } = await params;

  const exploreHref = `/${locale}/explore?${new URLSearchParams({
    city: "Bristol"
    // NOTE: you don’t have a “Beauty” category in your enum.
    // We filter by city, and users can choose category inside Explore.
  }).toString()}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Bristol Beauty Salons – Book trusted beauty services online",
    about: ["Beauty salon", "Bristol", "Online booking"],
    mainEntityOfPage: { "@type": "WebPage", "@id": exploreHref }
  };

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <header className="mb-8">
          <p className="text-sm font-medium text-slate-600">Slottick • Guides</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            Bristol Beauty Salons
          </h1>
          <p className="mt-3 text-slate-600">
            Bristol has a strong beauty scene with salons offering skincare, nails,
            lashes, brows, waxing, and more. If you want less messaging and faster
            confirmations, online booking is the simplest way to secure a time slot.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href={exploreHref}
              className="inline-flex rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Explore services in Bristol
            </a>
            <Link
              href={`/${locale}/explore`}
              className="inline-flex rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold hover:bg-slate-50"
            >
              Open marketplace
            </Link>
          </div>
        </header>

        <section className="space-y-8">
          <section>
            <h2 className="text-xl font-semibold">How beauty salon booking works in Bristol</h2>
            <p className="mt-2 text-slate-600">
              Most salons provide fixed time slots based on service duration (for example,
              30–60 minutes for treatments, longer for combinations). Online booking lets
              you pick a service, see real availability, and confirm instantly—without
              waiting for replies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">Popular beauty services in Bristol</h2>
            <ul className="mt-2 list-disc pl-5 text-slate-600 space-y-1">
              <li>Nails: manicure, pedicure, gel, extensions</li>
              <li>Lashes & brows: extensions, lifts, tints, shaping</li>
              <li>Skincare: facials, peels, routine treatments</li>
              <li>Waxing and body treatments</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold">Where to find trusted beauty salons in Bristol</h2>
            <p className="mt-2 text-slate-600">
              Use the marketplace to filter by city, category, and search terms
              (for example: “nails”, “lash”, “skincare”). Start here:
            </p>
            <p className="mt-3">
              <a className="font-semibold underline" href={exploreHref}>
                Browse Bristol businesses on Slottick
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">Why book through Slottick</h2>
            <p className="mt-2 text-slate-600">
              Slottick is built around real availability. Businesses set their services,
              durations, and working hours once—clients book available times without
              double booking or endless back-and-forth.
            </p>
          </section>
        </section>

        <div className="mt-10 border-t border-slate-200 pt-6 text-sm text-slate-600">
          More local searches:{" "}
          <Link className="underline font-semibold" href={`/${locale}/guides/lash-techs-bristol`}>
            Lash techs Bristol
          </Link>{" "}
          •{" "}
          <Link className="underline font-semibold" href={`/${locale}/guides/bristol-hair-braiders`}>
            Bristol hair braiders
          </Link>
        </div>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </main>
  );
}
