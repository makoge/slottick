// app/[locale]/layout.tsx
import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Analytics } from "@vercel/analytics/next";
import { notFound } from "next/navigation";

import {
  getMessages,
  locales,
  defaultLocale,
  t,
  type Locale,
} from "@/lib/i18n";
import LocaleSwitcher from "@/app/components/LocaleSwitcher";

const SITE_NAME = "Slottick";
const SITE_URL = "https://slottick.com"; // non-www, https

export const viewport: Viewport = {
  themeColor: "#cbd5e1",
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

function ogLocale(locale: string) {
  const map: Record<string, string> = { en: "en_US", fr: "fr_FR" };
  return map[locale] ?? undefined;
}

function ensureLocale(locale: string): Locale {
  if (locales.includes(locale as Locale)) return locale as Locale;
  return defaultLocale;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale } = await params;

  const locale = ensureLocale(rawLocale);
  const messages = await getMessages(locale);
  const canonical = `${SITE_URL}/${locale}`;

  const titleDefault =
    t(messages, "meta.home.title") !== "meta.home.title"
      ? t(messages, "meta.home.title")
      : "Slottick — Booking management for service businesses";

  const description =
    t(messages, "meta.home.description") !== "meta.home.description"
      ? t(messages, "meta.home.description")
      : "Booking management platform for salons, barbers and service businesses. Share one link that always shows real availability.";

  return {
    metadataBase: new URL(SITE_URL),
    manifest: "/manifest.webmanifest",
    title: {
      default: titleDefault,
      template: `%s | ${SITE_NAME}`,
    },
    description,
    alternates: {
      canonical,
      languages: {
        en: `${SITE_URL}/en`,
        fr: `${SITE_URL}/fr`,
      },
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    icons: {
      icon: [
        { url: "/favicon.ico" },
        { url: "/icon-32.png", sizes: "32x32", type: "image/png" },
        { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
        { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
      ],
      apple: "/apple-touch-icon.png",
    },
    openGraph: {
      type: "website",
      url: canonical,
      siteName: SITE_NAME,
      title: titleDefault,
      description,
      locale: ogLocale(locale),
      images: [
        {
          url: `${SITE_URL}/og.png`,
          width: 1200,
          height: 630,
          alt: SITE_NAME,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: titleDefault,
      description,
      images: [`${SITE_URL}/og.png`],
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;

  if (!locales.includes(rawLocale as Locale)) notFound();
  const locale = rawLocale as Locale;

  const messages = await getMessages(locale);

  const webSiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: `${SITE_URL}/${locale}`,
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/${locale}/explore?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  const normalizedLocale = locale?.toLowerCase().startsWith("fr") ? "fr" : "en";

  return (
    <div className="min-h-dvh flex flex-col bg-slate-300 font-sans text-slate-900 selection:bg-lime-100 selection:text-lime-950">
      <Analytics />

      {/* GLASS HEADER */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-400/40 bg-slate-300/80 backdrop-blur-xl supports-[backdrop-filter]:bg-slate-300/75 transition-all">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          {/* Left Brand Identity with bg-lime-100 tick */}
          <div className="flex items-center gap-6 sm:gap-8">
            <Link
              href={`/${locale}`}
              className="group flex items-center gap-2.5 transition-transform active:scale-95"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-lime-100 border border-lime-300/80 shadow-[0_2px_8px_rgba(132,204,22,0.25)] group-hover:bg-lime-200 transition-colors">
                <svg
                  className="h-4 w-4 text-lime-900"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2.6"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m4.5 12.75 6 6 9-13.5"
                  />
                </svg>
              </span>
              <span className="text-lg font-bold tracking-tight text-slate-900">
                {t(messages, "brand.name") === "brand.name"
                  ? SITE_NAME
                  : t(messages, "brand.name")}
              </span>
            </Link>

            <Link
              href={`/${locale}/tools`}
              className="hidden sm:inline-flex text-sm font-medium text-slate-700 hover:text-slate-950 transition-colors"
            >
              {t(messages, "nav.tools")}
            </Link>
          </div>

          {/* Right side controls */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <LocaleSwitcher />

            <Link
              href={`/${locale}/login`}
              className="relative inline-flex items-center justify-center rounded-xl border border-slate-400/60 bg-white/70 px-4 py-2 text-sm font-medium text-slate-900 shadow-sm backdrop-blur-md transition-all hover:bg-white/95 hover:border-slate-500 active:scale-95"
            >
              {t(messages, "nav.login") === "nav.login"
                ? "Login"
                : t(messages, "nav.login")}
            </Link>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 bg-slate-300">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
          {children}
        </div>
      </main>

      {/* GLASS FOOTER */}
      <footer className="mt-auto border-t border-slate-400/40 bg-slate-300/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:px-6 md:flex-row md:items-center md:justify-between">
          <p className="text-xs sm:text-sm font-medium text-slate-600">
            © {new Date().getFullYear()} {SITE_NAME}. All rights reserved.
          </p>

          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-xs sm:text-sm font-medium">
            <Link
              className="text-slate-600 hover:text-slate-950 transition-colors"
              href={`/${normalizedLocale}/blog`}
            >
              {t(messages, "footer.blog") === "footer.blog"
                ? "Blog"
                : t(messages, "footer.blog")}
            </Link>
            <Link
              className="text-slate-600 hover:text-slate-950 transition-colors"
              href={`/${locale}/privacy`}
            >
              {t(messages, "footer.privacy") === "footer.privacy"
                ? "Privacy"
                : t(messages, "footer.privacy")}
            </Link>
            <Link
              className="text-slate-600 hover:text-slate-950 transition-colors"
              href={`/${locale}/terms`}
            >
              {t(messages, "footer.terms") === "footer.terms"
                ? "Terms"
                : t(messages, "footer.terms")}
            </Link>
            <Link
              className="text-slate-600 hover:text-slate-950 transition-colors"
              href={`/${locale}/contact`}
            >
              {t(messages, "footer.contact") === "footer.contact"
                ? "Contact us"
                : t(messages, "footer.contact")}
            </Link>
          </nav>
        </div>
      </footer>

      {/* Site-wide structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteJsonLd) }}
      />
    </div>
  );
}
