import ReviewClient from "./review-client";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; businessSlug: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { locale, businessSlug } = await params;
  const { token } = await searchParams;

  return (
    <ReviewClient
      locale={locale}
      businessSlug={businessSlug}
      token={token ?? ""}
    />
  );
}
