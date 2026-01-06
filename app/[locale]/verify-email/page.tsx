import VerifyEmailClient from "./verify-email-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false }
};


export default async function VerifyEmailPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  return <VerifyEmailClient locale={locale} token={sp.token ?? ""} />;
}
