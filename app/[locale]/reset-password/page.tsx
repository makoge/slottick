import ResetPasswordClient from "./reset-password-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false }
};


export default async function ResetPasswordPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string; email?: string }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;

  return (
    <ResetPasswordClient
      locale={locale}
      token={sp.token ?? ""}
      email={sp.email ?? ""}
    />
  );
}
