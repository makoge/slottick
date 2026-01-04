import { getAuthedBusiness } from "@/lib/auth";
import { redirect } from "next/navigation";
import LoginClient from "./login-client";

export default async function LoginPage({ params }: { params: { locale: string } }) {
  const { locale } = params;

  const business = await getAuthedBusiness();
  if (business) redirect(`/${locale}/dashboard`);

  return <LoginClient />;
}

