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

  const canonical = `${baseUrl}/${locale}/guides/bristol-hair-braiders`;

  const title = "Bristol Hair Braiders – Book braiding appointments online";
  const description =
    "Find hair braiders in Bristol and book online. Learn common braiding styles, how long appointments take, and where to find real availability.";

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
    category: "Hair"
  }).toString()}`;

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <header className="mb-8">
          <p className="text-sm font-medium text-slate-600">Slottick • Guides</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Bristol Hair Braiders</h1>
          <p className="mt-3 text-slate-600">
            Braiding appointments are often longer and need proper time blocking.
            Online booking helps you choose the right service and reserve a slot that matches
            the actual duration.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href={exploreHref}
              className="inline-flex rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Explore hair braiders in Bristol
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
            <h2 className="text-xl font-semibold">How hair braiding appointments work</h2>
            <p className="mt-2 text-slate-600">
              Most braiding services require longer time slots. Booking platforms work best when the
              business lists accurate durations and availability rules so clients can book without
              back-and-forth.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">Popular braiding styles in Bristol</h2>
            <ul className="mt-2 list-disc pl-5 text-slate-600 space-y-1">
              <li>Box braids</li>
              <li>Knotless braids</li>
              <li>Cornrows</li>
              <li>Twists</li>
              <li>Protective styling appointments</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold">Where to find hair braiders in Bristol</h2>
            <p className="mt-2 text-slate-600">
              Start with the Bristol hair listings and filter based on what you need:
            </p>
            <p className="mt-3">
              <a className="font-semibold underline" href={exploreHref}>
                Browse hair services in Bristol on Slottick
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">Why Slottick works for long appointments</h2>
            <p className="mt-2 text-slate-600">
              Slottick supports service durations and buffer time so longer sessions are scheduled
              properly, protecting both the client’s time and the business schedule.
            </p>
          </section>
        </section>

        <div className="mt-10 border-t border-slate-200 pt-6 text-sm text-slate-600">
          Related:{" "}
          <Link className="underline font-semibold" href={`/${locale}/guides/bristol-beauty-salons`}>
            Bristol beauty salons
          </Link>{" "}
          •{" "}
          <Link className="underline font-semibold" href={`/${locale}/guides/lash-techs-bristol`}>
            Lash techs Bristol
          </Link>
        </div>
      </div>
    </main>
  );
}
