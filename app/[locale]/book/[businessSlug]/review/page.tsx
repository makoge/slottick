import ReviewClient from "./review-client";

export default async function Page({
  params,
  searchParams
}: {
  params: Promise<{ locale: string; businessSlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale, businessSlug } = await params;
  const sp = await searchParams;
  const bookingId = typeof sp.bookingId === "string" ? sp.bookingId : "";
  return <ReviewClient locale={locale} businessSlug={businessSlug} bookingId={bookingId} />;
}
