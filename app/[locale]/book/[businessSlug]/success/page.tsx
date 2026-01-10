import SuccessClient from "./success-client";

export default async function BookingSuccessPage({
  params
}: {
  params: { locale: string; businessSlug: string };
}) {
  return <SuccessClient  businessSlug={params.businessSlug} />;
}
