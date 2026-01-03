import type { ReactNode } from "react";
import Link from "next/link";
import { locales } from "@/lib/i18n";

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
    <html lang={locale}>
      <body className="min-h-dvh bg-white">
        <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
            <Link href={`/${locale}`} className="text-lg font-semibold tracking-tight">
              Slottick
            </Link>

            <Link
              href={`/${locale}/login`}
              className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-gray-50"
            >
              Login
            </Link>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>

        <footer className="border-t bg-white">
          <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-gray-600">© {new Date().getFullYear()} Slottick</p>
            <nav className="flex gap-4 text-sm">
              <Link className="text-gray-600 hover:text-gray-900" href={`/${locale}/privacy`}>
                Privacy
              </Link>
              <Link className="text-gray-600 hover:text-gray-900" href={`/${locale}/terms`}>
                Terms
              </Link>
            </nav>
          </div>
        </footer>
      </body>
    </html>
  );
}
