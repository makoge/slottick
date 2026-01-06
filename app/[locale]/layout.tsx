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

  const title = {
    default: "Slottick — Booking for beauty & wellness",
    template: `%s | ${siteName}`
  };

  const description =
    "Discover and book salons, barbers, lashes, nails, massage, fitness and more. Create a profile and share your booking link.";

  const languages = Object.fromEntries(
    locales.map((l) => [l, `${baseUrl}/${l}`])
  );

  const canonical = `${baseUrl}/${locale}`;

  return {
    metadataBase: new URL(baseUrl),
    title,
    description,
    applicationName: siteName,

    alternates: {
      canonical,
      languages
    },

    openGraph: {
      type: "website",
      url: canonical,
      siteName,
      title: title.default,
      description,
      locale,
      images: [
        {
          url: "/og.png",
          width: 1200,
          height: 630,
          alt: siteName
        }
      ]
    },

    twitter: {
      card: "summary_large_image",
      title: title.default,
      description,
      images: ["/og.png"]
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

        {/* HEADER */}
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

        {/* MAIN */}
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>

        {/* FOOTER */}
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

        {/* Global structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </body>
    </html>
  );
}
