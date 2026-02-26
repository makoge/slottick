// app/[locale]/blog/[slug]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAllBlogPosts, getBlogPostBySlug } from "@/lib/blog/route";

export const dynamic = "force-static";
const siteName = "Slottick";

export function generateStaticParams() {
  const locales = ["en", "fr"];
  return locales.flatMap((locale) => getAllBlogPosts().map((p) => ({ locale, slug: p.slug })));
}

export async function generateMetadata({
  params
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
      languages: { en: `/en/blog/${post.slug}`, fr: `/fr/blog/${post.slug}` }
    }
  };
}

const prettyDate = (iso: string, locale: string) =>
  new Intl.DateTimeFormat(locale, { year: "numeric", month: "long", day: "2-digit" }).format(new Date(iso));

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
  params
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: rawLocale, slug } = await params;
  const locale = rawLocale?.toLowerCase().startsWith("fr") ? "fr" : "en";

  const post = getBlogPostBySlug(slug);
  if (!post) notFound();

  const toc = post.sections.map((s) => ({
    id: toId(s.heading[locale]),
    title: s.heading[locale]
  }));

  const authorName = "Slottick";
  const readLabel = locale === "fr" ? "min de lecture" : "min read";

  return (
    <main className="min-h-screen">
      {/* Top band (matches site vibe) */}
      <section className="border-b bg-slate-900 text-white">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <nav className="text-sm text-slate-600">
            <Link className="hover:text-white" href={`/${locale}`}>
              {locale === "fr" ? "Accueil" : "Home"}
            </Link>{" "}
            <span className="mx-2 text-slate-300">/</span>
            <Link className="hover:text-white" href={`/${locale}/blog`}>
              Blog
            </Link>
          </nav>
        </div>
      </section>

      <article className="mx-auto max-w-6xl px-4 py-12 bg-white text-slate-900">
        {/* Real article layout: prose column + optional TOC */}
        <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
          {/* Main column */}
          <div>
            {/* Header feels editorial, not a “box” */}
            <header className="pb-10 border-b border-foreground/10">
              <div className="flex flex-wrap gap-2">
                {post.tags?.slice(0, 4).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-foreground/15 px-3 py-1 text-xs text-slate-600"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-5xl">
                {post.title[locale]}
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-600">
                {post.description[locale]}
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                <span className="font-medium text-slate-600">{authorName}</span>
                <span className="text-slate-200">•</span>
                <span>{prettyDate(post.publishedAt, locale)}</span>
                <span className="text-slate-200">•</span>
                <span>
                  {post.readingMinutes} {readLabel}
                </span>
              </div>
            </header>

            {/* Body: no cards, just clean reading */}
            <div className="mt-10 max-w-prose prose prose-slate prose-headings:tracking-tight prose-a:text-slate-900">
              {/* Optional: strong intro with dropcap feel */}
              {post.sections?.[0] ? (
                <p className="text-lg leading-relaxed text-slate-700">
                  <span className="float-left mr-2 mt-1 text-5xl font-semibold leading-none text-slate-900">
                    {toParagraphs(post.sections[0].body[locale])[0]?.trim()?.[0] ?? "A"}
                  </span>
                  {toParagraphs(post.sections[0].body[locale])[0]?.slice(1)}
                </p>
              ) : null}

              {/* Then render sections (skip the first paragraph used above if we did dropcap) */}
              <div className="mt-8 space-y-10">
                {post.sections.map((s, idx) => {
                  const id = toId(s.heading[locale]);
                  const paras = toParagraphs(s.body[locale]);
                  const sliced =
                    idx === 0 && paras.length > 0 ? paras.slice(1) : paras;

                  return (
                    <section key={idx} id={id} className="scroll-mt-24">
                      <h2 className="text-2xl font-semibold tracking-tight">{s.heading[locale]}</h2>

                      <div className="mt-4 space-y-4 text-slate-700 leading-relaxed">
                        {sliced.map((para, i) => (
                          <p key={i}>{para}</p>
                        ))}
                      </div>

                      {/* subtle divider like real blogs */}
                      <div className="mt-8 h-px w-full bg-foreground/10" />
                    </section>
                  );
                })}
              </div>

              {/* Minimal CTA: not a card, but a “note” */}
              <div className="mt-10 rounded-2xl bg-foreground/5 p-6">
                <h3 className="text-lg font-semibold">
                  {locale === "fr"
                    ? "Inscrivez votre entreprise et simplifiez vos réservations"
                    : "Register your business and simplify bookings"}
                </h3>
                <p className="mt-2 text-slate-600">
                  {locale === "fr"
                    ? "Un lien de réservation propre, des rappels automatiques, et une expérience premium pour vos clients."
                    : "A clean booking link, automated reminders, and a premium client experience."}
                </p>
                <div className="mt-4">
                  <Link className="inline-flex rounded-xl bg-slate-900 px-4 py-2 text-white" href={`/${locale}/register`}>
                    {locale === "fr" ? "Inscrire mon entreprise" : "Register your business"}
                  </Link>
                </div>
              </div>

              {/* Back link */}
              <div className="mt-10">
                <Link className="text-sm text-slate-600 hover:underline" href={`/${locale}/blog`}>
                  ← {locale === "fr" ? "Retour au blog" : "Back to blog"}
                </Link>
              </div>
            </div>
          </div>

          {/* Sidebar: “On this page” makes it feel like a real article */}
          <aside className="hidden lg:block">
            <div className="sticky top-10 rounded-2xl border bg-background p-6 shadow-sm">
              <p className="text-sm font-semibold">
                {locale === "fr" ? "Dans cet article" : "On this page"}
              </p>

              <div className="mt-4 space-y-2">
                {toc.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className="block text-sm text-foreground/70 hover:text-foreground hover:underline"
                  >
                    {item.title}
                  </a>
                ))}
              </div>

              <div className="mt-6 rounded-xl bg-foreground/5 p-4">
                <p className="text-sm text-slate-600">
                  {locale === "fr"
                    ? "Prêt à recevoir des rendez-vous 24/7 ?"
                    : "Ready to take bookings 24/7?"}
                </p>
                <Link className="mt-3 inline-flex rounded-xl bg-slate-900 px-4 py-2 text-white" href={`/${locale}/register`}>
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