import SuccessClient from "./success-client";

type Params = { locale: string; businessSlug: string };

export default async function Page({
  params,
  searchParams
}: {
  params: Promise<Params>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale, businessSlug } = await params;
  const sp = await searchParams;

  const bookingId = typeof sp.id === "string" ? sp.id : "";

  return (
    <SuccessClient locale={locale} businessSlug={businessSlug} bookingId={bookingId} />
  );
}
