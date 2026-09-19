import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function CancelPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isFr = locale === "fr";

  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] w-full items-center justify-center px-4 py-12 sm:px-6">
      {/* Ambient background glow accents */}
      <div className="pointer-events-none absolute -top-12 h-64 w-64 rounded-full bg-rose-200/40 blur-3xl sm:h-80 sm:w-80" />
      <div className="pointer-events-none absolute -bottom-12 h-64 w-64 rounded-full bg-slate-400/30 blur-3xl sm:h-80 sm:w-80" />

      {/* Main Glassmorphic Feedback Card */}
      <div className="relative z-10 w-full max-w-xl overflow-hidden rounded-3xl border border-slate-400/40 bg-white/75 p-6 text-center shadow-xl backdrop-blur-2xl sm:p-10">
        {/* Slottick Identity Pill */}
        <div className="inline-flex items-center gap-2 rounded-full border border-lime-300/80 bg-lime-100 px-3.5 py-1 text-xs font-bold text-lime-950 shadow-xs">
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-lime-900 text-[10px] text-white">
            ✓
          </span>
          <span className="font-mono uppercase tracking-wider">
            {isFr ? "Statut de la transaction" : "Transaction Status"}
          </span>
        </div>

        {/* Warning Icon Badge */}
        <div className="mx-auto mt-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-rose-300/80 bg-rose-100/90 text-3xl shadow-sm backdrop-blur-md">
          <span className="text-rose-600">⚠</span>
        </div>

        {/* Heading */}
        <h1 className="mt-6 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          {isFr ? "Paiement annulé" : "Payment Cancelled"}
        </h1>

        {/* Lead Text */}
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-600 sm:text-base">
          {isFr
            ? "Votre transaction a été interrompue. Aucun montant n’a été débité de votre compte. Vous pouvez réessayer ou explorer nos offres à tout moment."
            : "Your transaction was cancelled. No charges were made to your account. You can retry setup or return to your booking workspace at any time."}
        </p>

        {/* Information Callout */}
        <div className="mt-6 rounded-2xl border border-slate-300/80 bg-slate-100/70 p-4 text-xs font-mono text-slate-600">
          {isFr
            ? "Besoin d'aide ? Contactez support@slottick.com"
            : "Need assistance? Contact support@slottick.com"}
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href={`/${locale}/pricing`}
            className="inline-flex items-center justify-center rounded-2xl border border-lime-300/80 bg-lime-100 px-6 py-3.5 font-mono text-xs font-bold uppercase tracking-wider text-lime-950 shadow-xs transition hover:bg-lime-200 active:scale-95"
          >
            {isFr ? "Réessayer l’abonnement" : "Try Again →"}
          </Link>

          <Link
            href={`/${locale}`}
            className="inline-flex items-center justify-center rounded-2xl border border-slate-400/60 bg-white/80 px-6 py-3.5 font-mono text-xs font-semibold text-slate-800 shadow-2xs backdrop-blur-sm transition hover:bg-white hover:text-slate-950 active:scale-95"
          >
            {isFr ? "Retour à Slottick" : "Back to Slottick"}
          </Link>
        </div>
      </div>
    </div>
  );
}
