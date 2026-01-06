// app/[locale]/layout.tsx
import type { ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Analytics } from "@vercel/analytics/next";
import { locales } from "@/lib/i18n";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const { locale } = params;

  const siteName = "Slottick";
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://slottick.com";

  const canonical = `${baseUrl}/${locale}`;

  const title = {
    default: "Slottick — Booking management for service businesses",
    template: `%s | ${siteName}`
  };

  const description =
    "Booking management platform for salons, barbers and service businesses. Share one link that always shows real availability.";

  const languages = Object.fromEntries(locales.map((l) => [l, `${baseUrl}/${l}`]));

  return {
    metadataBase: new URL(baseUrl),
    title,
    description,
    alternates: { canonical, languages },
    openGraph: {
      type: "website",
      url: canonical,
      siteName,
      title: title.default,
      description,
      locale,
      images: [{ url: "/og.png", width: 1200, height: 630, alt: siteName }]
    },
    twitter: {
      card: "summary_large_image",
      title: title.default,
      description,
      images: ["/og.png"]
    },
    robots: {
      index: true,
      follow: true
    },
    icons: {
      icon: "/favicon.ico",
      apple: "/apple-touch-icon.png"
    }
  };
}

export default function LocaleLayout({
  children,
  params
}: {
  children: ReactNode;
  params: { locale: string };
}) {
  const { locale } = params;

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://slottick.com";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Slottick",
    url: `${baseUrl}/${locale}`,
    potentialAction: {
      "@type": "SearchAction",
      target: `${baseUrl}/${locale}/explore?q={search_term_string}`,
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <html lang={locale}>
      <body className="min-h-dvh bg-white text-slate-900">
        <Analytics />

        <header className="sticky top-0 z-50 w-full bg-slate-900">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
            <Link
              href={`/${locale}`}
              className="text-lg font-semibold tracking-tight text-white"
            >
              Slottick
            </Link>

            <Link
              href={`/${locale}/login`}
              className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Login
            </Link>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>

        <footer className="bg-slate-900">
          <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 md:flex-row md:items-center md:justify-between">
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

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </body>
    </html>
  );
}

