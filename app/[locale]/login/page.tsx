import { getAuthedBusiness } from "@/lib/auth";
import { redirect } from "next/navigation";
import LoginClient from "./login-client";

export default async function LoginPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // ✅ if already logged in, go straight to dashboard
  const business = await getAuthedBusiness();
  if (business) {
    redirect(`/${locale}/dashboard`);
  }

  return <LoginClient locale={locale} />;
}
