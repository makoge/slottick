// app/[locale]/dashboard/page.tsx
import type { Metadata } from "next";
import DashboardClient from "./dashboard-client";
import { getAuthedBusiness } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { getMessages, locales, type Locale, t } from "@/lib/i18n";

const SITE_URL = "https://slottick.com";

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;

  if (!locales.includes(raw as Locale)) notFound();
  const locale = raw as Locale;

  const messages = await getMessages(locale);

  const title = t(messages, "meta.dashboard.title");
  const description = t(messages, "meta.dashboard.description");

  const canonical = `${SITE_URL}/${locale}/dashboard`;

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        en: `${SITE_URL}/en/dashboard`,
        fr: `${SITE_URL}/fr/dashboard`
      }
    }
  };
}

export default async function DashboardPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const business = await getAuthedBusiness();
  if (!business) redirect(`/${locale}/login`);

  return (
    <DashboardClient
      locale={locale}
      business={{
        name: business.name,
        slug: business.slug,
        website: business.website ?? undefined,
        ownerEmail: business.ownerEmail,
        industry: business.industry,
        city: business.city,
        country: business.country,
        street: business.street ?? undefined,
        postalCode: business.postalCode ?? undefined,
        logoUrl: business.logoUrl,
        description: business.description ?? undefined,
        createdAt: business.createdAt.toISOString()
      }}
    />
  );
}

