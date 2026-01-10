"use client";

import { useParams } from "next/navigation";

export function useLocale(defaultLocale = "en") {
  const params = useParams() as { locale?: string } | null;
  const locale = params?.locale;
  return typeof locale === "string" && locale.length ? locale : defaultLocale;
}
