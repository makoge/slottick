import ExploreClient from "./explore-client";
import { BUSINESS_DIRECTORY, ALL_CATEGORIES } from "@/lib/business-directory";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/businesses`, {
    cache: "no-store"
  });

  const data = await res.json();

  return (
    <ExploreClient
      locale={locale}
      businesses={data.businesses ?? []}
      categories={["Lash","Nails","Brows","Barber","Massage","Other"] as any}
    />
  );
}
