// app/[locale]/blog/page.tsx
import Link from "next/link";
import { getPosts } from "@/lib/blog/posts";

export const dynamic = "force-static";

const prettyDate = (iso: string, locale: string) =>
  new Intl.DateTimeFormat(locale, { year: "numeric", month: "short", day: "2-digit" }).format(new Date(iso));

export default async function BlogIndexPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = rawLocale?.toLowerCase().startsWith("fr") ? "fr" : "en";

  const posts = getPosts();

  const title = locale === "fr" ? "Blog Slottick" : "Slottick Blog";
  const subtitle =
    locale === "fr"
      ? "Inscrivez votre entreprise dès maintenant et profitez des avantages d’un système de réservation."
      : "Register your business now and start enjoying the benefits of a booking system.";

  return (
    <main className="min-h-screen">
      {/* Dark hero matching header/footer */}
      <section className="border-b bg-slate-900 text-white">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">{title}</h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/70">{subtitle}</p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-6 md:grid-cols-2">
          {posts.map((p) => (
            <Link
              key={p.slug}
              href={`/${locale}/blog/${p.slug}`}
              className="group rounded-2xl border bg-background p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <p className="text-sm text-foreground/60">
                {prettyDate(p.publishedAt, locale)} • {p.readingMinutes} {locale === "fr" ? "min" : "min read"}
              </p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight group-hover:underline">{p.title[locale]}</h2>
              <p className="mt-2 text-foreground/70">{p.description[locale]}</p>
            </Link>
          ))}
        </div>

        {/* Single CTA only (no pricing, no SEO advice) */}
        <div className="mt-10">
          <Link className="inline-flex rounded-xl bg-slate-900 px-4 py-2 text-white" href={`/${locale}/register`}>
            {locale === "fr" ? "Inscrire mon entreprise" : "Register your business"}
          </Link>
        </div>
      </section>
    </main>
  );
}