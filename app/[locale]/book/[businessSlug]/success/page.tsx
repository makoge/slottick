import SuccessClient from "./success-client";

export default async function BookingSuccessPage({
  params
}: {
  params: Promise<{ locale: string; businessSlug: string }>;
}) {
  const { businessSlug } = await params;
  return <SuccessClient businessSlug={businessSlug} />;
}
