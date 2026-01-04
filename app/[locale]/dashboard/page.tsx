import DashboardClient from "./dashboard-client";
import { getAuthedBusiness } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage({
  params
}: {
  params: { locale: string };
}) {
  const { locale } = await params;

  const business = await getAuthedBusiness();
  if (!business) {
    redirect(`/${locale}/login`);
  }

  return <DashboardClient locale={locale} />;
}
