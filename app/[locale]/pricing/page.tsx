import { getAuthedBusiness } from "@/lib/auth";
import { SubscribeButton } from "./subscribe-button";

export default async function PricingPage({
  params,
}: {
  params: { locale: string };
}) {
  const business = await getAuthedBusiness();

  if (!business) {
    return <p>Please sign in</p>;
  }

  return (
    <div>
      <h1>Upgrade</h1>
      <SubscribeButton
        locale={params.locale}
        userId={business.id}
        email={business.ownerEmail}
      />
    </div>
  );
}
