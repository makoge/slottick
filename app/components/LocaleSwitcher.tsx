"use client";

import { usePathname, useRouter } from "next/navigation";
import { locales, type Locale, defaultLocale } from "@/lib/i18n";

function getLocaleFromPath(pathname: string): Locale {
  const seg = pathname.split("/")[1] as Locale | undefined;
  return (seg && (locales as readonly string[]).includes(seg)) ? seg : defaultLocale;
}

function switchLocalePath(pathname: string, nextLocale: Locale) {
  const parts = pathname.split("/");
  if (parts.length < 2) return `/${nextLocale}`;
  parts[1] = nextLocale; // replace locale segment
  const next = parts.join("/");
  return next.startsWith("/") ? next : `/${nextLocale}`;
}

export default function LocaleSwitcher() {
  const router = useRouter();
  const pathname = usePathname() || `/${defaultLocale}`;

  const current = getLocaleFromPath(pathname);

  return (
    <select
      aria-label="Language"
      className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
      value={current}
      onChange={(e) => {
        const nextLocale = e.target.value as Locale;
        const nextPath = switchLocalePath(pathname, nextLocale);
        router.push(nextPath);
        router.refresh();
      }}
    >
      <option value="en">English</option>
      <option value="fr">Français</option>
    </select>
  );
}
