import DashboardClient from "./dashboard-client";
import { getAuthedBusiness } from "@/lib/auth";
import { redirect } from "next/navigation";

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
        industry: business.industry, // ✅ renamed
        city: business.city,
        country: business.country,
        street: business.street ?? undefined, // ✅ optional
        postalCode: business.postalCode ?? undefined, // ✅ optional
        logoUrl: business.logoUrl,
        createdAt: business.createdAt.toISOString()
      }}
    />
  );
}

