// app/[locale]/blog/[slug]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAllBlogPosts, getBlogPostBySlug } from "@/lib/blog/route";

export const dynamic = "force-static";
const siteName = "Slottick";

export function generateStaticParams() {
  const locales = ["en", "fr"];
  return locales.flatMap((locale) =>
    getAllBlogPosts().map((p) => ({ locale, slug: p.slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  const locale = rawLocale?.toLowerCase().startsWith("fr") ? "fr" : "en";

  const post = getBlogPostBySlug(slug);
  if (!post) return {};

  const title = post.title[locale];
  const description = post.description[locale];

  return {
    title: `${title} | ${siteName}`,
    description,
    alternates: {
      canonical: `/${locale}/blog/${post.slug}`,
      languages: { en: `/en/blog/${post.slug}`, fr: `/fr/blog/${post.slug}` },
    },
  };
}

const prettyDate = (iso: string, locale: string) =>
  new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "2-digit",
  }).format(new Date(iso));

function toParagraphs(text: string) {
  return text.split("\n\n").filter(Boolean);
}

function toId(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: rawLocale, slug } = await params;
  const locale = rawLocale?.toLowerCase().startsWith("fr") ? "fr" : "en";

  const post = getBlogPostBySlug(slug);
  if (!post) notFound();

  const toc = post.sections.map((s) => ({
    id: toId(s.heading[locale]),
    title: s.heading[locale],
  }));

  const authorName = "Slottick Editorial";
  const readLabel = locale === "fr" ? "min de lecture" : "min read";

  return (
    <div className="w-full pb-20">
      {/* 1. BREADCRUMB BAR */}
      <section className="relative w-full border-b border-slate-400/30 bg-white/40 px-4 py-6 shadow-xs backdrop-blur-xl sm:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <nav className="flex items-center gap-2 font-mono text-xs font-semibold text-slate-600">
            <Link
              className="hover:text-slate-950 transition-colors"
              href={`/${locale}`}
            >
              {locale === "fr" ? "Accueil" : "Home"}
            </Link>
            <span className="text-slate-400">/</span>
            <Link
              className="hover:text-slate-950 transition-colors"
              href={`/${locale}/blog`}
            >
              Blog
            </Link>
            <span className="text-slate-400">/</span>
            <span className="truncate max-w-[200px] text-slate-900 sm:max-w-md">
              {post.title[locale]}
            </span>
          </nav>

          <Link
            href={`/${locale}/blog`}
            className="font-mono text-xs font-bold text-slate-700 hover:text-slate-950 transition-colors"
          >
            ← {locale === "fr" ? "Tous les articles" : "All articles"}
          </Link>
        </div>
      </section>

      {/* 2. MAIN READING CANVAS */}
      <div className="mx-auto mt-8 max-w-6xl px-4 sm:px-8">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-start">
          {/* Main Reading Column */}
          <article className="rounded-3xl border border-slate-400/40 bg-white/75 p-6 shadow-xl backdrop-blur-2xl sm:p-10 lg:col-span-8">
            {/* Article Editorial Header */}
            <header className="border-b border-slate-300/70 pb-8">
              <div className="flex flex-wrap gap-2">
                {post.tags?.slice(0, 4).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-lg border border-lime-300/80 bg-lime-100 px-2.5 py-0.5 font-mono text-[11px] font-bold text-lime-950"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
                {post.title[locale]}
              </h1>

              <p className="mt-3 text-base leading-relaxed text-slate-700 sm:text-lg">
                {post.description[locale]}
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3 font-mono text-xs text-slate-600">
                <span className="font-bold text-slate-900">{authorName}</span>
                <span className="text-slate-300">•</span>
                <span>{prettyDate(post.publishedAt, locale)}</span>
                <span className="text-slate-300">•</span>
                <span className="rounded-md border border-slate-300/80 bg-white px-2 py-0.5 text-slate-800">
                  {post.readingMinutes} {readLabel}
                </span>
              </div>
            </header>

            {/* Prose Body */}
            <div className="mt-8">
              {/* Dropcap Introduction */}
              {post.sections?.[0] ? (
                <div className="text-base leading-relaxed text-slate-800 sm:text-lg">
                  <span className="float-left mr-3 mt-1 flex h-14 w-14 items-center justify-center rounded-2xl border border-lime-300/80 bg-lime-100 font-mono text-3xl font-extrabold text-lime-950 shadow-xs">
                    {toParagraphs(
                      post.sections[0].body[locale],
                    )[0]?.trim()?.[0] ?? "A"}
                  </span>
                  <p className="inline">
                    {toParagraphs(post.sections[0].body[locale])[0]?.slice(1)}
                  </p>
                </div>
              ) : null}

              {/* Sections Breakdown */}
              <div className="mt-8 space-y-10">
                {post.sections.map((s, idx) => {
                  const id = toId(s.heading[locale]);
                  const paras = toParagraphs(s.body[locale]);
                  const sliced =
                    idx === 0 && paras.length > 0 ? paras.slice(1) : paras;

                  return (
                    <section key={idx} id={id} className="scroll-mt-24">
                      <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                        {s.heading[locale]}
                      </h2>

                      <div className="mt-4 space-y-4 text-sm leading-relaxed text-slate-700 sm:text-base">
                        {sliced.map((para, i) => (
                          <p key={i}>{para}</p>
                        ))}
                      </div>

                      <div className="mt-8 h-px w-full bg-slate-200/80" />
                    </section>
                  );
                })}
              </div>

              {/* Integrated Callout */}
              <div className="mt-10 rounded-2xl border border-slate-300/80 bg-slate-100/70 p-6 sm:p-7">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md border border-lime-300/80 bg-lime-100 font-mono text-xs font-bold text-lime-950">
                    ✓
                  </span>
                  <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-900">
                    {locale === "fr"
                      ? "Inscrivez votre entreprise et simplifiez vos réservations"
                      : "Register your business and simplify bookings"}
                  </h3>
                </div>

                <p className="mt-2 text-xs leading-relaxed text-slate-600 sm:text-sm">
                  {locale === "fr"
                    ? "Un lien de réservation propre, des rappels automatiques, et une expérience premium pour vos clients."
                    : "A clean booking link, automated reminders, and a premium client experience with zero setup fees."}
                </p>

                <div className="mt-4">
                  <Link
                    className="inline-flex items-center justify-center rounded-xl border border-lime-300/80 bg-lime-100 px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-lime-950 shadow-xs transition hover:bg-lime-200 active:scale-95"
                    href={`/${locale}/register`}
                  >
                    {locale === "fr"
                      ? "Inscrire mon entreprise"
                      : "Register your business"}{" "}
                    →
                  </Link>
                </div>
              </div>

              {/* Back to Blog */}
              <div className="mt-10 pt-4 border-t border-slate-200">
                <Link
                  className="font-mono text-xs font-bold text-slate-700 hover:text-slate-950 transition-colors"
                  href={`/${locale}/blog`}
                >
                  ← {locale === "fr" ? "Retour au blog" : "Back to blog feed"}
                </Link>
              </div>
            </div>
          </article>

          {/* 3. STICKY TABLE OF CONTENTS SIDEBAR */}
          <aside className="space-y-6 lg:col-span-4 lg:sticky lg:top-24">
            <div className="rounded-3xl border border-slate-400/40 bg-white/70 p-6 shadow-sm backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <p className="font-mono text-xs font-bold uppercase tracking-wider text-slate-500">
                  {locale === "fr" ? "Dans cet article" : "On this page"}
                </p>
                <span className="font-mono text-[10px] text-slate-400">
                  {toc.length} sections
                </span>
              </div>

              <nav className="mt-4 space-y-2">
                {toc.map((item, idx) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className="group flex items-start gap-2.5 rounded-xl px-2.5 py-1.5 font-mono text-xs text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
                  >
                    <span className="text-slate-400 group-hover:text-lime-700">
                      0{idx + 1}
                    </span>
                    <span className="truncate">{item.title}</span>
                  </a>
                ))}
              </nav>

              {/* Sidebar Action Card */}
              <div className="mt-6 rounded-2xl border border-slate-300/70 bg-slate-100/70 p-4">
                <p className="text-xs font-bold text-slate-900">
                  {locale === "fr"
                    ? "Prêt à recevoir des rendez-vous 24/7 ?"
                    : "Ready to take bookings 24/7?"}
                </p>
                <p className="mt-1 text-[11px] text-slate-600">
                  {locale === "fr"
                    ? "Activez votre calendrier Slottick en moins de deux minutes."
                    : "Launch your dedicated schedule link in under two minutes."}
                </p>
                <Link
                  className="mt-3 inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-2 font-mono text-xs font-bold text-white shadow-xs transition hover:bg-slate-800 active:scale-95"
                  href={`/${locale}/register`}
                >
                  {locale === "fr" ? "Commencer" : "Get Started"} →
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
