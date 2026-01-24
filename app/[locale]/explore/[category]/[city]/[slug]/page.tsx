import { notFound } from "next/navigation";

export default async function Page({
  params
}: {
  params: Promise<{
    locale: string;
    category: string;
    city: string;
    slug: string;
  }>;
}) {
  const { locale, category, city, slug } = await params;

  const res = await fetch(
    `https://slottick.com/api/businesses/${slug}`,
    { cache: "no-store" }
  );

  if (!res.ok) notFound();
  const data = await res.json();

  if (!data?.business) notFound();

  // 🔒 sanity check (prevents spam URLs ranking)
  if (
  data.business.slug !== slug ||
  data.business.city.toLowerCase() !== city.toLowerCase() ||
  data.business.category.toLowerCase() !== category.toLowerCase()
) {
  notFound();
}


  return (
    <div>
      {/* reuse your existing booking UI */}
      {/* or redirect to booking page if you want */}
    </div>
  );
}
