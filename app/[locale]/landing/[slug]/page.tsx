// app/[locale]/landing/[slug]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { LANDING_PAGES, getLandingBySlug } from "@/lib/landing/pages";

export const dynamic = "force-static";
const siteName = "Slottick";

function toParagraphs(text: string) {
  return text.split("\n\n").filter(Boolean);
}

export function generateStaticParams() {
  const locales = ["en", "fr"];
  return locales.flatMap((locale) => LANDING_PAGES.map((p) => ({ locale, slug: p.slug })));
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  const locale = rawLocale?.toLowerCase().startsWith("fr") ? "fr" : "en";

  const page = getLandingBySlug(slug);
  if (!page) return {};

  return {
    title: `${page.title[locale]} | ${siteName}`,
    description: page.description[locale],
    alternates: {
      canonical: `/${locale}/landing/${page.slug}`,
      languages: {
        en: `/en/landing/${page.slug}`,
        fr: `/fr/landing/${page.slug}`
      }
    }
  };
}

export default async function LandingSlugPage({
  params
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: rawLocale, slug } = await params;
  const locale = rawLocale?.toLowerCase().startsWith("fr") ? "fr" : "en";

  const page = getLandingBySlug(slug);
  if (!page) notFound();

  return (
    <main className="min-h-screen">
      <article className="mx-auto max-w-6xl px-4 py-10">
        <nav className="text-sm text-foreground/60">
          <Link className="hover:underline" href={`/${locale}`}>
            {locale === "fr" ? "Accueil" : "Home"}
          </Link>{" "}
          <span className="mx-2">/</span>
          <Link className="hover:underline" href={`/${locale}/landing`}>
            {locale === "fr" ? "Solutions" : "Solutions"}
          </Link>
        </nav>

        <header className="mt-8 rounded-3xl border border-white/10 bg-slate-900 p-8 text-white shadow-sm">
          <p className="text-sm text-white/70">{page.keyword}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-5xl">{page.title[locale]}</h1>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-white/70">{page.description[locale]}</p>

          <div className="mt-6">
            <Link className="inline-flex rounded-xl bg-white px-4 py-2 text-slate-900" href={`/${locale}/register`}>
              {page.ctaLabel[locale]}
            </Link>
          </div>
        </header>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_320px]">
          <div className="space-y-10">
            {page.sections.map((s, idx) => (
              <section key={idx} className="rounded-2xl border bg-background p-7 shadow-sm">
                <h2 className="text-2xl font-semibold tracking-tight">{s.heading[locale]}</h2>
                <div className="mt-4 space-y-4 text-foreground/80 leading-relaxed">
                  {toParagraphs(s.body[locale]).map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
              </section>
            ))}

            {/* Strong CTA (single link only) */}
            <section className="rounded-3xl border bg-background p-8 shadow-sm">
              <h2 className="text-2xl font-semibold tracking-tight">
                {locale === "fr"
                  ? "Inscrivez votre entreprise dès maintenant"
                  : "Register your business now"}
              </h2>
              <p className="mt-3 max-w-2xl text-foreground/70">
                {locale === "fr"
                  ? "Commencez à profiter des avantages d’un système de réservation moderne."
                  : "Start enjoying the benefits of a modern booking system."}
              </p>
              <div className="mt-5">
                <Link className="rounded-xl bg-slate-900 px-4 py-2 text-white" href={`/${locale}/register`}>
                  {locale === "fr" ? "Inscrire mon entreprise" : "Register your business"}
                </Link>
              </div>
            </section>
          </div>

          {/* Sidebar internal links */}
          <aside className="h-fit space-y-4 lg:sticky lg:top-10">
            <div className="rounded-2xl border bg-background p-6 shadow-sm">
              
              <h3 className="mt-1 text-lg font-semibold">
                {locale === "fr" ? "Explorez les solutions" : "Explore solutions"}
              </h3>

              <div className="mt-4 space-y-2">
                {LANDING_PAGES.map((p) => (
                  <Link
                    key={p.slug}
                    href={`/${locale}/landing/${p.slug}`}
                    className={`block rounded-xl border px-3 py-2 text-sm hover:bg-foreground/5 ${
                      p.slug === page.slug ? "bg-foreground/5" : ""
                    }`}
                  >
                    {p.title[locale]}
                  </Link>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border bg-background p-6 shadow-sm">
              <h4 className="text-sm font-semibold">{locale === "fr" ? "Action" : "Action"}</h4>
              <p className="mt-2 text-sm text-foreground/70">
                {locale === "fr"
                  ? "Créez un lien de réservation pro et commencez à recevoir des rendez-vous."
                  : "Create a premium booking link and start receiving appointments."}
              </p>
              <div className="mt-4">
                <Link className="rounded-xl bg-slate-900 px-4 py-2 text-white" href={`/${locale}/register`}>
                  {locale === "fr" ? "Inscrire mon entreprise" : "Register your business"}
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </article>
    </main>
  );
}