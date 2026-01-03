import ResetPasswordClient from "./reset-password-client";

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
