import type { ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Analytics } from "@vercel/analytics/next";
import { locales } from "@/lib/i18n";
import InstallPWAButton from "@/app/components/InstallPWAButton";


const SITE_NAME = "Slottick";
const SITE_URL = "https://slottick.com"; // ✅ single source of truth (non-www)

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  const canonical = `${SITE_URL}/${locale}`;
  const languages = Object.fromEntries(locales.map((l) => [l, `${SITE_URL}/${l}`]));

  const titleDefault = "Slottick — Booking management for service businesses";
  const description =
    "Booking management platform for salons, barbers and service businesses. Share one link that always shows real availability.";

  return {
    metadataBase: new URL(SITE_URL),

    
  manifest: "/manifest.webmanifest", 
  themeColor: "#0f172a", 

    title: {
      default: titleDefault,
      template: `%s | ${SITE_NAME}`
    },
    description,
    alternates: { canonical, languages },

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
      locale,
      images: [
        {
          url: `${SITE_URL}/og.png`, // ✅ absolute
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
      images: [`${SITE_URL}/og.png`] // ✅ absolute
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
    <div className="min-h-dvh bg-white text-slate-900">
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
            <InstallPWAButton />
          <Link
            href={`/${locale}/login`}
            className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Login
          </Link>
        </div>
      </header>

      {/* MAIN (layout only wraps pages) */}
      <main className="bg-white">
        <div className="mx-auto max-w-6xl px-6 py-16">{children}</div>
      </main>

      {/* FOOTER */}
      <footer className="bg-slate-900">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-10 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-slate-300">
            © {new Date().getFullYear()} Slottick
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
    </div>
  );
}
