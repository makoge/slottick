
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function SuccessPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isFr = locale === "fr";

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[75vh] max-w-3xl items-center justify-center">
        <section className="w-full rounded-[32px] border border-slate-200 bg-white p-6 text-center shadow-xl sm:p-10">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-4xl">
            🎉
          </div>

          <h1 className="mt-6 text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            {isFr ? "Paiement réussi" : "Payment successful"}
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
            {isFr
              ? "Votre abonnement est maintenant actif. Vous pouvez retourner sur Slottick et continuer à gérer vos réservations."
              : "Your subscription is now active. You can return to Slottick and continue managing your bookings."}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href={`/${locale}/dashboard`}
              className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-6 py-4 text-base font-semibold text-white shadow-lg transition hover:bg-slate-800"
            >
              {isFr ? "Retour au tableau de bord" : "Back to dashboard"}
            </Link>

            <Link
              href={`/${locale}`}
              className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-6 py-4 text-base font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              {isFr ? "Retour à Slottick" : "Back to Slottick"}
            </Link>
          </div>

          <p className="mt-6 text-sm text-slate-400">
            {isFr
              ? "Merci d’avoir choisi Slottick."
              : "Thanks for choosing Slottick."}
          </p>
        </section>
      </div>
    </main>
  );
}