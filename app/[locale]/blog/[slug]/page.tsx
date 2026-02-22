// app/[locale]/blog/[slug]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { BLOG_POSTS, getPostBySlug } from "@/lib/blog/posts";

export const dynamic = "force-static";
const siteName = "Slottick";

export function generateStaticParams() {
  const locales = ["en", "fr"];
  return locales.flatMap((locale) => BLOG_POSTS.map((p) => ({ locale, slug: p.slug })));
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  const locale = rawLocale?.toLowerCase().startsWith("fr") ? "fr" : "en";

  const post = getPostBySlug(slug);
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

export default async function BlogPostPage({
  params
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: rawLocale, slug } = await params;
  const locale = rawLocale?.toLowerCase().startsWith("fr") ? "fr" : "en";

  const post = getPostBySlug(slug);
  if (!post) notFound();

  return (
    <main className="min-h-screen">
      <article className="mx-auto max-w-6xl px-4 py-10">
        <nav className="text-sm text-foreground/60">
          <Link className="hover:underline" href={`/${locale}`}>
            {locale === "fr" ? "Accueil" : "Home"}
          </Link>{" "}
          <span className="mx-2">/</span>
          <Link className="hover:underline" href={`/${locale}/blog`}>
            Blog
          </Link>
        </nav>

        {/* Dark hero matching header/footer */}
        <header className="mt-8 rounded-3xl border border-white/10 bg-slate-900 p-8 text-white shadow-sm">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">{post.title[locale]}</h1>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-white/70">{post.description[locale]}</p>
          <div className="mt-4 text-sm text-white/60">
            {prettyDate(post.publishedAt, locale)} • {post.readingMinutes} {locale === "fr" ? "min" : "min read"}
          </div>
        </header>

        <div className="mt-10 space-y-10">
          {post.sections.map((s, idx) => (
            <section key={idx} className="rounded-2xl border bg-background p-7 shadow-sm">
              <h2 className="text-2xl font-semibold tracking-tight">{s.heading[locale]}</h2>
              <div className="mt-4 space-y-4 text-foreground/80 leading-relaxed">
                {toParagraphs(s.body[locale]).map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            </section>
          ))}

          {/* CTA single */}
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
      </article>
    </main>
  );
}