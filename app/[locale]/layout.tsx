// app/[locale]/layout.tsx
import type { ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Analytics } from "@vercel/analytics/next";
import { notFound } from "next/navigation";

import InstallPWAButton from "@/app/components/InstallPWAButton";
import { getMessages, locales, defaultLocale, t, type Locale } from "@/lib/i18n";
import LocaleSwitcher from "@/app/components/LocaleSwitcher";


const SITE_NAME = "Slottick";
const SITE_URL = "https://slottick.com"; // non-www, https

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
  params
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale } = await params;

  // For metadata, don’t 404—fallback to default to avoid edge weirdness.
  const locale = ensureLocale(rawLocale);

  const messages = await getMessages(locale);

  const canonical = `${SITE_URL}/${locale}`;

  // i18n-ready: if keys don’t exist yet, your t() returns the key,
  // so we keep hard fallbacks to avoid ugly output.
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

    // PWA
    manifest: "/manifest.webmanifest",
    themeColor: "#0f172a",

    title: {
      default: titleDefault,
      template: `%s | ${SITE_NAME}`
    },
    description,

    
    alternates: { canonical, 
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
        "max-video-preview": -1
      }
    },

    icons: {
      icon: [
        { url: "/favicon.ico" },
        { url: "/icon-32.png", sizes: "32x32", type: "image/png" },
        { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
        { url: "/icon-512.png", sizes: "512x512", type: "image/png" }
      ],
      apple: "/apple-touch-icon.png"
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
          alt: SITE_NAME
        }
      ]
    },

    twitter: {
      card: "summary_large_image",
      title: titleDefault,
      description,
      images: [`${SITE_URL}/og.png`]
    }
  };
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;

  // For pages/layout, invalid locale should 404 (cleaner + safer)
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
      "query-input": "required name=search_term_string"
    }
  };
  const normalizedLocale =
  locale?.toLowerCase().startsWith("fr") ? "fr" : "en";

  return (
    <html lang={locale}>
      <body className="min-h-dvh bg-white text-slate-900">
        <Analytics />

        {/* HEADER */}
        <header className="sticky top-0 z-50 w-full bg-slate-900">
  <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
    
    {/* Left side */}
    <div className="flex items-center gap-8">
      <Link
        href={`/${locale}`}
        className="text-lg font-semibold tracking-tight text-white"
      >
        {t(messages, "brand.name") === "brand.name"
          ? SITE_NAME
          : t(messages, "brand.name")}
      </Link>

      <Link
  href={`/${locale}/tools`}
  className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
>
  {t(messages, "nav.tools")}
</Link>
    </div>

    {/* Right side */}
    <div className="flex items-center gap-3">
      <InstallPWAButton />
      <LocaleSwitcher />
      <Link
        href={`/${locale}/login`}
        className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
      >
        {t(messages, "nav.login") === "nav.login"
          ? "Login"
          : t(messages, "nav.login")}
      </Link>
    </div>

  </div>
</header>

        {/* MAIN */}
        <main className="bg-white">
          <div className="mx-auto max-w-6xl px-6 py-12">{children}</div>
        </main>

        {/* FOOTER */}
        <footer className="bg-slate-900">
          <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-10 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-slate-300">
              ©  {SITE_NAME}
            </p>

            <nav className="flex gap-4 text-sm">
              <Link
  className="text-slate-300 hover:text-white"
                href={`/${normalizedLocale}/blog`}
                >
                {t(messages, "footer.blog") === "footer.blog"
                  ? "Blog"
                 : t(messages, "footer.blog")}
              </Link>
              <Link className="text-slate-300 hover:text-white" href={`/${locale}/privacy`}>
                {t(messages, "footer.privacy") === "footer.privacy" ? "Privacy" : t(messages, "footer.privacy")}
              </Link>
              <Link className="text-slate-300 hover:text-white" href={`/${locale}/terms`}>
                {t(messages, "footer.terms") === "footer.terms" ? "Terms" : t(messages, "footer.terms")}
              </Link>
              <Link className="text-slate-300 hover:text-white" href={`/${locale}/contact`}>
                {t(messages, "footer.contact") === "footer.contact" ? "Contact us" : t(messages, "footer.contact")}
              </Link>
            </nav>
          </div>
        </footer>

        {/* Site-wide structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteJsonLd) }}
        />
      </body>
    </html>
  );
}
