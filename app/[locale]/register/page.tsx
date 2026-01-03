import RegisterClient from "./register-client";

export default async function RegisterPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <RegisterClient locale={locale} />;
}

