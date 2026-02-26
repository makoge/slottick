// app/[locale]/blog/page.tsx
import Link from "next/link";
import { getAllBlogPosts } from "@/lib/blog/route";

export const dynamic = "force-static";

const prettyDate = (iso: string, locale: string) =>
  new Intl.DateTimeFormat(locale, { year: "numeric", month: "short", day: "2-digit" }).format(new Date(iso));

function initials(title: string) {
  const parts = title.trim().split(" ").filter(Boolean);
  const a = parts[0]?.[0] ?? "S";
  const b = parts[1]?.[0] ?? "B";
  return (a + b).toUpperCase();
}

export default async function BlogIndexPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = rawLocale?.toLowerCase().startsWith("fr") ? "fr" : "en";

  
  const posts = getAllBlogPosts();
  const featured = posts[0];
  const rest = posts.slice(1);

  const title = locale === "fr" ? "Blog Slottick" : "Slottick Blog";
  const subtitle =
    locale === "fr"
      ? "Des articles clairs, modernes, et utiles pour remplir votre agenda."
      : "Modern, practical writing to help you fill your calendar.";

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="border-b bg-slate-900 text-white">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <div className="flex flex-col gap-6">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-sm text-white/80">
              <span className="h-2 w-2 rounded-full bg-white/70" />
              {locale === "fr" ? "Lectures courtes, impact fort" : "Short reads, big impact"}
            </div>

            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">{title}</h1>
            <p className="max-w-2xl text-base leading-relaxed text-white/70">{subtitle}</p>

            <div>
              <Link
                className="inline-flex rounded-xl bg-white px-4 py-2 font-medium text-slate-900"
                href={`/${locale}/register`}
              >
                {locale === "fr" ? "Inscrire mon entreprise" : "Register your business"}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-10 lg:grid-cols-[1fr_340px]">
          {/* Left: Featured + Feed */}
          <div className="space-y-10">
            {/* Featured article */}
            {featured ? (
              <Link
                href={`/${locale}/blog/${featured.slug}`}
                className="group block overflow-hidden rounded-3xl border bg-background shadow-sm transition hover:shadow-md"
              >
                <div className="grid gap-0 md:grid-cols-[280px_1fr]">
                  {/* “Cover” placeholder (looks like a real publication tile) */}
                  <div className="relative flex h-full min-h-[220px] items-end bg-slate-900 p-6 text-white">
                    <div className="absolute inset-0 opacity-70" />
                    <div className="relative">
                      <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/80">
                        {locale === "fr" ? "Article à la une" : "Featured"}
                      </div>
                      <div className="mt-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-lg font-semibold">
                        {initials(featured.title[locale])}
                      </div>
                    </div>
                  </div>

                  <div className="p-7">
                    <p className="text-sm text-foreground/60">
                      {prettyDate(featured.publishedAt, locale)} • {featured.readingMinutes}{" "}
                      {locale === "fr" ? "min" : "min read"}
                    </p>

                    <h2 className="mt-2 text-2xl font-semibold tracking-tight group-hover:underline">
                      {featured.title[locale]}
                    </h2>

                    <p className="mt-3 text-foreground/70">{featured.description[locale]}</p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {featured.tags.slice(0, 4).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border px-3 py-1 text-xs text-foreground/70"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="mt-5 inline-flex items-center gap-2 text-sm font-medium">
                      {locale === "fr" ? "Lire l’article" : "Read article"} <span aria-hidden>→</span>
                    </div>
                  </div>
                </div>
              </Link>
            ) : null}

            {/* Feed */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                {locale === "fr" ? "Derniers articles" : "Latest articles"}
              </h3>

              <div className="divide-y rounded-2xl border bg-background">
                {rest.map((p) => (
                  <Link
                    key={p.slug}
                    href={`/${locale}/blog/${p.slug}`}
                    className="group grid gap-4 p-6 transition hover:bg-foreground/5 sm:grid-cols-[1fr_120px]"
                  >
                    <div>
                      <p className="text-sm text-foreground/60">
                        {prettyDate(p.publishedAt, locale)} • {p.readingMinutes}{" "}
                        {locale === "fr" ? "min" : "min read"}
                      </p>
                      <h4 className="mt-1 text-xl font-semibold tracking-tight group-hover:underline">
                        {p.title[locale]}
                      </h4>
                      <p className="mt-2 line-clamp-2 text-foreground/70">{p.description[locale]}</p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {p.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="rounded-full border px-3 py-1 text-xs text-foreground/70">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Thumbnail placeholder (no images yet, but looks like a real blog) */}
                    <div className="hidden sm:block">
                      <div className="flex h-24 w-full items-center justify-center rounded-2xl bg-slate-900 text-white/90">
                        <span className="text-sm font-semibold">{initials(p.title[locale])}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Sidebar */}
          <aside className="h-fit space-y-4 lg:sticky lg:top-10">
            <div className="rounded-2xl border bg-background p-6 shadow-sm">
              <h4 className="text-sm font-semibold">{locale === "fr" ? "À propos" : "About"}</h4>
              <p className="mt-2 text-sm text-foreground/70">
                {locale === "fr"
                  ? "Des conseils concrets pour automatiser vos réservations et offrir une expérience premium."
                  : "Practical ideas to automate bookings and deliver a premium customer experience."}
              </p>
            </div>

            <div className="rounded-2xl border bg-background p-6 shadow-sm">
              <h4 className="text-sm font-semibold">{locale === "fr" ? "Action" : "Action"}</h4>
              <p className="mt-2 text-sm text-foreground/70">
                {locale === "fr"
                  ? "Créez votre lien de réservation et commencez à recevoir des rendez-vous."
                  : "Create your booking link and start receiving appointments."}
              </p>
              <div className="mt-4">
                <Link className="inline-flex rounded-xl bg-slate-900 px-4 py-2 text-white" href={`/${locale}/register`}>
                  {locale === "fr" ? "Inscrire mon entreprise" : "Register your business"}
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}