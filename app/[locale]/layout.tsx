import type { ReactNode } from "react";
import Link from "next/link";
import { locales } from "@/lib/i18n";
import { Analytics } from "@vercel/analytics/next";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <div className="min-h-dvh bg-white text-slate-900">
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
            <Link
              className="text-slate-300 hover:text-white"
              href={`/${locale}/privacy`}
            >
              Privacy
            </Link>
            <Link
              className="text-slate-300 hover:text-white"
              href={`/${locale}/terms`}
            >
              Terms
            </Link>
            <Link
              className="text-slate-300 hover:text-white"
              href={`/${locale}/contact`}
            >
              Contact us
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
