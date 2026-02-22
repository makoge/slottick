// app/[locale]/landing/page.tsx
import Link from "next/link";
import { getLandingPages } from "@/lib/landing/pages";

export const dynamic = "force-static";

export default async function LandingIndexPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = rawLocale?.toLowerCase().startsWith("fr") ? "fr" : "en";

  const pages = getLandingPages();

  return (
    <main className="min-h-screen">
      <section className="border-b bg-slate-900 text-white">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            {locale === "fr" ? "Solutions de réservation" : "Booking Solutions"}
          </h1>
          <p className="mt-4 max-w-2xl text-white/70">
            {locale === "fr"
            ? "Attirez plus de clients, remplissez votre agenda et développez votre activité sans stress."
            : "Attract more clients, fill your calendar, and grow your business without the stress."}
          </p>

          <div className="mt-6">
            <Link className="inline-flex rounded-xl bg-white px-4 py-2 text-slate-900" href={`/${locale}/register`}>
              {locale === "fr" ? "Inscrire mon entreprise" : "Register your business"}
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-6 md:grid-cols-2">
          {pages.map((p) => (
            <Link
              key={p.slug}
              href={`/${locale}/landing/${p.slug}`}
              className="group rounded-2xl border bg-background p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <p className="text-sm text-foreground/60">{p.keyword}</p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight group-hover:underline">
                {p.title[locale]}
              </h2>
              <p className="mt-2 text-foreground/70">{p.description[locale]}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}