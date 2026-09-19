// app/[locale]/blog/page.tsx
import Link from "next/link";
import { getAllBlogPosts } from "@/lib/blog/route";

export const dynamic = "force-static";

const prettyDate = (iso: string, locale: string) =>
  new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(new Date(iso));

function initials(title: string) {
  const parts = title.trim().split(" ").filter(Boolean);
  const a = parts[0]?.[0] ?? "S";
  const b = parts[1]?.[0] ?? "B";
  return (a + b).toUpperCase();
}

export default async function BlogIndexPage({
  params,
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
    <div className="w-full pb-20">
      {/* 1. EDITORIAL HERO HEADER */}
      <section className="relative w-full border-b border-slate-400/30 bg-white/40 px-4 py-10 shadow-xs backdrop-blur-xl sm:px-8 sm:py-14">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-lime-300/80 bg-lime-100 px-3.5 py-1 text-xs font-bold text-lime-950 shadow-xs">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-lime-900 text-[10px] text-white">
                  ✓
                </span>
                <span className="font-mono uppercase tracking-wider">
                  {locale === "fr"
                    ? "Lectures courtes, impact fort"
                    : "Short reads, big impact"}
                </span>
              </div>

              <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
                {title}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-700 sm:text-base">
                {subtitle}
              </p>
            </div>

            <Link
              href={`/${locale}/register`}
              className="inline-flex h-11 shrink-0 items-center justify-center rounded-2xl border border-lime-300/80 bg-lime-100 px-6 font-mono text-xs font-bold uppercase tracking-wider text-lime-950 shadow-xs transition hover:bg-lime-200 active:scale-95"
            >
              {locale === "fr"
                ? "Inscrire mon entreprise"
                : "Register your business"}
            </Link>
          </div>
        </div>
      </section>

      {/* 2. MAIN FEED & SIDEBAR */}
      <div className="mx-auto mt-10 max-w-6xl px-4 sm:px-8">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-start">
          {/* Main Content Column */}
          <div className="space-y-8 lg:col-span-8">
            {/* Featured Article Card */}
            {featured ? (
              <Link
                href={`/${locale}/blog/${featured.slug}`}
                className="group block overflow-hidden rounded-3xl border border-slate-400/40 bg-white/75 p-6 shadow-sm backdrop-blur-xl transition hover:-translate-y-1 hover:border-slate-400/80 hover:bg-white/95 hover:shadow-md sm:p-8"
              >
                <div className="flex flex-col gap-6 md:flex-row md:items-center">
                  {/* Visual Initial Emblem */}
                  <div className="flex h-36 w-full shrink-0 items-center justify-center rounded-2xl border border-lime-300/80 bg-lime-100 md:h-44 md:w-44">
                    <span className="font-mono text-3xl font-extrabold text-lime-950">
                      {initials(featured.title[locale])}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-lg border border-lime-300/80 bg-lime-100 px-2.5 py-0.5 font-mono text-[11px] font-bold text-lime-950">
                        {locale === "fr" ? "À la une" : "Featured"}
                      </span>
                      <span className="font-mono text-xs text-slate-500">
                        {prettyDate(featured.publishedAt, locale)} •{" "}
                        {featured.readingMinutes}{" "}
                        {locale === "fr" ? "min" : "min read"}
                      </span>
                    </div>

                    <h2 className="mt-2.5 text-xl font-extrabold tracking-tight text-slate-900 group-hover:text-black sm:text-2xl">
                      {featured.title[locale]}
                    </h2>

                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-600">
                      {featured.description[locale]}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {featured.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-lg border border-slate-300/70 bg-slate-100/80 px-2.5 py-0.5 font-mono text-[11px] text-slate-700"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>

                    <div className="mt-5 inline-flex items-center gap-1.5 font-mono text-xs font-bold text-slate-900 group-hover:underline">
                      <span>
                        {locale === "fr" ? "Lire l’article" : "Read article"}
                      </span>
                      <span>→</span>
                    </div>
                  </div>
                </div>
              </Link>
            ) : null}

            {/* Latest Articles Feed */}
            <div className="space-y-4">
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-600">
                {locale === "fr" ? "Derniers articles" : "Latest articles"}
              </h3>

              <div className="space-y-3">
                {rest.map((p) => (
                  <Link
                    key={p.slug}
                    href={`/${locale}/blog/${p.slug}`}
                    className="group flex flex-col justify-between gap-4 rounded-3xl border border-slate-400/40 bg-white/70 p-5 shadow-2xs backdrop-blur-xl transition hover:border-slate-400/80 hover:bg-white/95 hover:shadow-sm sm:flex-row sm:items-center sm:p-6"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-mono text-xs text-slate-500">
                        {prettyDate(p.publishedAt, locale)} • {p.readingMinutes}{" "}
                        {locale === "fr" ? "min" : "min read"}
                      </div>

                      <h4 className="mt-1 text-lg font-bold tracking-tight text-slate-900 group-hover:text-black">
                        {p.title[locale]}
                      </h4>

                      <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-600 sm:text-sm">
                        {p.description[locale]}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {p.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-lg border border-slate-300/70 bg-slate-100/70 px-2 py-0.5 font-mono text-[10px] text-slate-700"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-slate-300/80 bg-white/90 shadow-2xs group-hover:border-lime-300/80 group-hover:bg-lime-100 transition-colors">
                      <span className="font-mono text-xs font-bold text-slate-900 group-hover:text-lime-950">
                        {initials(p.title[locale])}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Sticky Sidebar */}
          <aside className="space-y-5 lg:col-span-4 lg:sticky lg:top-24">
            <div className="rounded-3xl border border-slate-400/40 bg-white/70 p-6 shadow-sm backdrop-blur-xl">
              <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-500">
                {locale === "fr" ? "À propos" : "About"}
              </h4>
              <p className="mt-2 text-xs leading-relaxed text-slate-700 sm:text-sm">
                {locale === "fr"
                  ? "Des conseils concrets pour automatiser vos réservations et offrir une expérience premium."
                  : "Practical ideas to automate bookings and deliver a premium customer experience."}
              </p>
            </div>

            <div className="rounded-3xl border border-slate-400/40 bg-slate-900/95 p-6 text-white shadow-md backdrop-blur-xl">
              <span className="inline-flex rounded-full border border-slate-700 bg-slate-800 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-lime-300">
                {locale === "fr" ? "Action" : "Get Started"}
              </span>
              <p className="mt-3 text-xs leading-relaxed text-slate-300 sm:text-sm">
                {locale === "fr"
                  ? "Créez votre lien de réservation et commencez à recevoir des rendez-vous."
                  : "Create your booking link and start receiving appointments without back-and-forth messages."}
              </p>
              <div className="mt-5">
                <Link
                  className="inline-flex w-full items-center justify-center rounded-2xl border border-lime-300/80 bg-lime-100 px-4 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-lime-950 shadow-xs transition hover:bg-lime-200 active:scale-95"
                  href={`/${locale}/register`}
                >
                  {locale === "fr"
                    ? "Inscrire mon entreprise"
                    : "Register your business"}
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
