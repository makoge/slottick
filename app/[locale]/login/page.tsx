import { getAuthedBusiness } from "@/lib/auth";
import { redirect } from "next/navigation";
import LoginClient from "./login-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params; // no need for fallback normally

  const business = await getAuthedBusiness();
  if (business) redirect(`/${locale}/dashboard`);

  return <LoginClient />;
}



