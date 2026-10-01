"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

const dict = {
  en: {
    badge: "Client Pass",
    title: "Create your booking account",
    subtitle:
      "Keep track of upcoming appointments, rebook favorite specialists with one tap, and manage your receipts.",
    back: "Back to home",
    google: "Continue with Google",
    facebook: "Continue with Facebook",
    or: "or sign up with email",
    name: "Full name",
    namePlaceholder: "Alex Morgan",
    email: "Email address",
    emailPlaceholder: "alex@example.com",
    phone: "Mobile number",
    phonePlaceholder: "+372 555 1234",
    phoneOptional: "(for SMS slot reminders)",
    password: "Password",
    passwordHint: "Minimum 6 characters",
    creating: "Setting up your account...",
    create: "Create Account & Continue",
    already: "Already have a Slottick account?",
    login: "Sign in",
    perk1: "1-tap rebooking with your favorite stylists & therapists",
    perk2: "Real-time SMS & email notifications when slots open",
    perk3: "No surprise cancellation fees — manage bookings directly",
    errName: "Please enter your full name.",
    errEmail: "Please enter a valid email address.",
    errPass: "Password must be at least 6 characters.",
    errFail: "Could not create account. Please try again.",
    errNet: "Network error. Please verify your connection.",
  },
  fr: {
    badge: "Accès Client",
    title: "Créez votre compte de réservation",
    subtitle:
      "Suivez vos rendez-vous, réservez vos praticiens favoris en un clic et gérez vos reçus.",
    back: "Retour à l'accueil",
    google: "Continuer avec Google",
    facebook: "Continuer avec Facebook",
    or: "ou avec votre e-mail",
    name: "Nom complet",
    namePlaceholder: "Alexandre Dupont",
    email: "Adresse e-mail",
    emailPlaceholder: "alexandre@example.fr",
    phone: "Numéro de mobile",
    phonePlaceholder: "+33 6 12 34 56 78",
    phoneOptional: "(pour les rappels SMS)",
    password: "Mot de passe",
    passwordHint: "Au moins 6 caractères",
    creating: "Création de votre compte...",
    create: "Créer le compte et continuer",
    already: "Vous avez déjà un compte ?",
    login: "Connexion",
    perk1: "Réservation en 1 clic chez vos spécialistes favoris",
    perk2: "Rappels SMS et notifications quand un créneau se libère",
    perk3: "Gestion claire et autonome de vos annulations et reports",
    errName: "Veuillez saisir votre nom complet.",
    errEmail: "Veuillez entrer une adresse e-mail valide.",
    errPass: "Le mot de passe doit comporter au moins 6 caractères.",
    errFail: "Impossible de créer le compte. Veuillez réessayer.",
    errNet: "Erreur réseau. Veuillez vérifier votre connexion.",
  },
} as const;

export default function CustomerSignupClient() {
  const router = useRouter();
  const params = useParams<{ locale?: string }>();
  const sp = useSearchParams();

  const locale = params?.locale === "fr" ? "fr" : "en";
  const t = dict[locale];

  const next = sp.get("next") || `/${locale}/customer`;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loginHref = useMemo(
    () => `/${locale}/customer/login?next=${encodeURIComponent(next)}`,
    [locale, next],
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    setError(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!name.trim()) return setError(t.errName);
    if (!cleanEmail || !isValidEmail(cleanEmail)) return setError(t.errEmail);
    if (password.length < 6) return setError(t.errPass);

    setLoading(true);
    try {
      const res = await fetch("/api/customer/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: cleanEmail,
          phone: phone.trim() || null,
          password,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || t.errFail);
        return;
      }

      router.push(next);
      router.refresh();
    } catch {
      setError(t.errNet);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50/70 text-slate-900 selection:bg-lime-200">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-center px-4 py-10 sm:px-6 lg:py-16">
        {/* Top brand header */}
        <div className="mb-8 flex w-full max-w-xl items-center justify-between">
          <Link
            href={`/${locale}`}
            className="group inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-slate-500 transition hover:text-slate-900"
          >
            <span className="transition-transform group-hover:-translate-x-1">
              ←
            </span>
            <span>{t.back}</span>
          </Link>
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-slate-400">
            Slottick
          </span>
        </div>

        <div className="w-full max-w-xl overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-xl shadow-slate-200/50">
          {/* Accent Header */}
          <div className="border-b border-slate-100 bg-gradient-to-b from-slate-50 to-white px-8 pt-8 pb-6 sm:px-10">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-lime-300/80 bg-lime-100/90 px-3 py-0.5 font-mono text-[10px] font-extrabold uppercase tracking-wider text-lime-950">
              <span className="h-1.5 w-1.5 rounded-full bg-lime-600 animate-pulse" />
              {t.badge}
            </div>
            <h1 className="mt-3 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              {t.title}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              {t.subtitle}
            </p>
          </div>

          <div className="px-8 py-8 sm:px-10">
            {/* Quick OAuth Actions */}
            <div className="grid gap-2.5 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => signIn("google", { callbackUrl: next })}
                className="flex items-center justify-center gap-2.5 rounded-2xl border border-slate-200 bg-white px-4 py-3 font-mono text-xs font-bold text-slate-800 shadow-2xs transition hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98]"
              >
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Google</span>
              </button>

              <a
                className="flex items-center justify-center gap-2.5 rounded-2xl border border-slate-200 bg-white px-4 py-3 font-mono text-xs font-bold text-slate-800 shadow-2xs transition hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98]"
                href={`/api/auth/signin/facebook?callbackUrl=${encodeURIComponent(next)}`}
              >
                <svg
                  className="h-4 w-4 shrink-0 text-[#1877F2]"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                <span>Facebook</span>
              </a>
            </div>

            {/* Divider */}
            <div className="relative my-7">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-3 font-mono font-medium text-slate-400">
                  {t.or}
                </span>
              </div>
            </div>

            {/* Signup Form */}
            <form onSubmit={submit} className="space-y-4">
              {error && (
                <div className="flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50/90 p-4 font-mono text-xs text-rose-800">
                  <span className="font-bold">⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block font-mono text-xs font-bold uppercase tracking-wider text-slate-700">
                  {t.name}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t.namePlaceholder}
                  required
                  disabled={loading}
                  className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 transition placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block font-mono text-xs font-bold uppercase tracking-wider text-slate-700">
                  {t.email}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.emailPlaceholder}
                  required
                  disabled={loading}
                  className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 transition placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <div className="flex items-baseline justify-between">
                  <label className="font-mono text-xs font-bold uppercase tracking-wider text-slate-700">
                    {t.phone}
                  </label>
                  <span className="font-mono text-[10px] text-slate-400">
                    {t.phoneOptional}
                  </span>
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t.phonePlaceholder}
                  disabled={loading}
                  className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 transition placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <div className="flex items-baseline justify-between">
                  <label className="font-mono text-xs font-bold uppercase tracking-wider text-slate-700">
                    {t.password}
                  </label>
                  <span className="font-mono text-[10px] text-slate-400">
                    {t.passwordHint}
                  </span>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  disabled={loading}
                  className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 transition placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl border border-lime-300/80 bg-lime-300 py-3.5 font-mono text-xs font-extrabold uppercase tracking-wider text-lime-950 shadow-sm transition hover:bg-lime-200 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-lime-950 border-t-transparent" />
                    <span>{t.creating}</span>
                  </>
                ) : (
                  <span>{t.create}</span>
                )}
              </button>
            </form>

            {/* Existing user link */}
            <div className="mt-6 border-t border-slate-100 pt-5 text-center text-xs text-slate-500">
              <span>{t.already} </span>
              <Link
                href={loginHref}
                className="font-mono font-bold text-slate-900 underline underline-offset-4 hover:text-slate-700"
              >
                {t.login}
              </Link>
            </div>
          </div>

          {/* Social Proof & Booking Perks Footer */}
          <div className="border-t border-slate-100 bg-slate-50/80 px-8 py-5 sm:px-10">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5 font-mono text-[11px] text-slate-600">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-lime-200 text-[10px] text-lime-900 font-bold">
                  ✓
                </span>
                <span>{t.perk1}</span>
              </div>
              <div className="flex items-center gap-2.5 font-mono text-[11px] text-slate-600">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-lime-200 text-[10px] text-lime-900 font-bold">
                  ✓
                </span>
                <span>{t.perk2}</span>
              </div>
              <div className="flex items-center gap-2.5 font-mono text-[11px] text-slate-600">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-lime-200 text-[10px] text-lime-900 font-bold">
                  ✓
                </span>
                <span>{t.perk3}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
