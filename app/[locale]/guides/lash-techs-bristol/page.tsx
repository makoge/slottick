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

  const canonical = `${baseUrl}/${locale}/guides/lash-techs-bristol`;

  const title = "Lash Techs Bristol – Find and book lash services online";
  const description =
    "Find lash techs in Bristol and book online. Learn common lash services, what to ask before booking, and where to find real availability.";

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
    city: "Bristol",
    category: "Lash"
  }).toString()}`;

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <header className="mb-8">
          <p className="text-sm font-medium text-slate-600">Slottick • Guides</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Lash Techs Bristol</h1>
          <p className="mt-3 text-slate-600">
            Looking for lash extensions, hybrid sets, or a lash lift in Bristol?
            Online booking makes it easier to compare availability and lock in a time
            that fits your schedule.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href={exploreHref}
              className="inline-flex rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Explore lash techs in Bristol
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
            <h2 className="text-xl font-semibold">How lash appointment booking works</h2>
            <p className="mt-2 text-slate-600">
              Lash services are time-based and depend on the type of set and infill schedule.
              A good booking page shows real availability, service duration, and clear options.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">Popular lash services in Bristol</h2>
            <ul className="mt-2 list-disc pl-5 text-slate-600 space-y-1">
              <li>Classic eyelash extensions</li>
              <li>Hybrid sets</li>
              <li>Volume / Russian volume</li>
              <li>Infill appointments</li>
              <li>Lash lift and tint</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold">Where to book lash techs in Bristol</h2>
            <p className="mt-2 text-slate-600">
              Use the Bristol lash listings to filter, compare, and book directly:
            </p>
            <p className="mt-3">
              <a className="font-semibold underline" href={exploreHref}>
                Browse lash techs in Bristol on Slottick
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">Why Slottick helps clients and lash techs</h2>
            <p className="mt-2 text-slate-600">
              Clients see confirmed times. Lash techs protect their availability with clear
              durations, breaks, and buffer time—reducing last-minute confusion.
            </p>
          </section>
        </section>

        <div className="mt-10 border-t border-slate-200 pt-6 text-sm text-slate-600">
          Related:{" "}
          <Link className="underline font-semibold" href={`/${locale}/guides/bristol-beauty-salons`}>
            Bristol beauty salons
          </Link>{" "}
          •{" "}
          <Link className="underline font-semibold" href={`/${locale}/guides/bristol-hair-braiders`}>
            Bristol hair braiders
          </Link>
        </div>
      </div>
    </main>
  );
}
