import BookingClient from "./booking-client";

type Params = { locale: string; businessSlug: string };

export default async function Page({ params }: { params: Promise<Params> }) {
  const { locale, businessSlug } = await params;
  return <BookingClient locale={locale} businessSlug={businessSlug} />;
}
