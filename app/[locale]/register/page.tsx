import RegisterClient from "./register-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false }
};


export default async function RegisterPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <RegisterClient locale={locale} />;
}

