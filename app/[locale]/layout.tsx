// app/[locale]/layout.tsx
import type { ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Analytics } from "@vercel/analytics/next";
import { locales } from "@/lib/i18n";
import InstallPWAButton from "@/app/components/InstallPWAButton";

const SITE_NAME = "Slottick";
const SITE_URL = "https://slottick.com"; // non-www, https

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

function ogLocale(locale: string) {
  // OpenGraph locale expects region format (ex: en_US). If unknown, omit.
  const map: Record<string, string> = { en: "en_US", fr: "fr_FR" };
  return map[locale] ?? undefined;
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  const canonical = `${SITE_URL}/${locale}`;
  const titleDefault = "Slottick — Booking management for service businesses";
  const description =
    "Booking management platform for salons, barbers and service businesses. Share one link that always shows real availability.";

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

    // ✅ IMPORTANT: don’t emit hreflang until you truly translate the content.
    // If you later translate, re-add: alternates: { canonical, languages: {...} }
    alternates: { canonical },

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
  const { locale } = await params;

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

  return (
    <html lang={locale}>
      <body className="min-h-dvh bg-white text-slate-900">
        <Analytics />

        {/* HEADER */}
        <header className="sticky top-0 z-50 w-full bg-slate-900">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
            <Link
              href={`/${locale}`}
              className="text-lg font-semibold tracking-tight text-white"
            >
              Slottick
            </Link>

            <div className="flex items-center gap-3">
              <InstallPWAButton />
              <Link
                href={`/${locale}/login`}
                className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
              >
                Login
              </Link>
            </div>
          </div>
        </header>

        {/* MAIN */}
        <main className="bg-white">
          {/* ✅ remove global py-16 to avoid double-padding (pages should control spacing) */}
          <div className="mx-auto max-w-6xl px-6">{children}</div>
        </main>

        {/* FOOTER */}
        <footer className="bg-slate-900">
          <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-10 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-slate-300">
              © {new Date().getFullYear()} {SITE_NAME}
            </p>

            <nav className="flex gap-4 text-sm">
              <Link className="text-slate-300 hover:text-white" href={`/${locale}/privacy`}>
                Privacy
              </Link>
              <Link className="text-slate-300 hover:text-white" href={`/${locale}/terms`}>
                Terms
              </Link>
              <Link className="text-slate-300 hover:text-white" href={`/${locale}/contact`}>
                Contact us
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
