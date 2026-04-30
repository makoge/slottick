"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

const dict = {
  en: {
    title: "Create account",
    subtitle: "Save bookings, rebook faster, and discover services near you.",
    back: "Back",
    google: "Continue with Google",
    facebook: "Continue with Facebook",
    or: "or",
    name: "Full name",
    email: "Email",
    phone: "Phone (optional)",
    password: "Password",
    creating: "Creating...",
    create: "Create account",
    already: "Already have an account?",
    login: "Log in",
    errName: "Enter your name.",
    errEmail: "Enter a valid email.",
    errPass: "Password must be at least 6 characters.",
    errFail: "Signup failed",
    errNet: "Network error. Try again.",
  },
  fr: {
    title: "Créer un compte",
    subtitle:
      "Enregistrez vos réservations, réservez plus vite et découvrez des services près de vous.",
    back: "Retour",
    google: "Continuer avec Google",
    facebook: "Continuer avec Facebook",
    or: "ou",
    name: "Nom complet",
    email: "E-mail",
    phone: "Téléphone (facultatif)",
    password: "Mot de passe",
    creating: "Création...",
    create: "Créer un compte",
    already: "Vous avez déjà un compte ?",
    login: "Se connecter",
    errName: "Entrez votre nom.",
    errEmail: "Entrez une adresse e-mail valide.",
    errPass: "Le mot de passe doit contenir au moins 6 caractères.",
    errFail: "Échec de l’inscription",
    errNet: "Erreur réseau. Réessayez.",
  },
} as const;

export default function CustomerSignupClient() {
  const router = useRouter();
  const params = useParams<{ locale?: string }>();
  const sp = useSearchParams();

  const locale = params?.locale === "fr" ? "fr" : "en";
  const t = dict[locale];

  // 👉 FIX: default goes to dashboard
  const next = sp.get("next") || `/${locale}/customer`;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loginHref = useMemo(
    () => `/${locale}/customer/login?next=${encodeURIComponent(next)}`,
    [locale, next]
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    setError(null);

    const e1 = email.trim().toLowerCase();
    if (!name.trim()) return setError(t.errName);
    if (!e1 || !isValidEmail(e1)) return setError(t.errEmail);
    if (password.length < 6) return setError(t.errPass);

    setLoading(true);
    try {
      const res = await fetch("/api/customer/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: e1,
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
    } catch {
      setError(t.errNet);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-md px-6 py-14">
        <section className="rounded-3xl border border-slate-200 p-8 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-600">Slottick</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight">
                {t.title}
              </h1>
              <p className="mt-2 text-slate-600">{t.subtitle}</p>
            </div>

            <a className="text-sm underline text-slate-600" href={`/${locale}`}>
              {t.back}
            </a>
          </div>

          {/* OAuth */}
          <div className="mt-6 grid gap-2">
            <a
              className="rounded-xl border border-slate-200 px-4 py-3 text-center text-sm font-semibold hover:bg-slate-50"
              href={`/api/auth/signin/google?callbackUrl=${encodeURIComponent(next)}`}
            >
              {t.google}
            </a>

            <a
              className="rounded-xl border border-slate-200 px-4 py-3 text-center text-sm font-semibold hover:bg-slate-50"
              href={`/api/auth/signin/facebook?callbackUrl=${encodeURIComponent(next)}`}
            >
              {t.facebook}
            </a>
          </div>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <div className="text-xs text-slate-500">{t.or}</div>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <form onSubmit={submit} className="grid gap-4">
            {error && (
              <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <label className="grid gap-1 text-sm">
              {t.name}
              <input
                className="rounded-xl border border-slate-200 px-3 py-2"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t.name}
                required
                disabled={loading}
              />
            </label>

            <label className="grid gap-1 text-sm">
              {t.email}
              <input
                type="email"
                className="rounded-xl border border-slate-200 px-3 py-2"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                required
                disabled={loading}
              />
            </label>

            <label className="grid gap-1 text-sm">
              {t.phone}
              <input
                className="rounded-xl border border-slate-200 px-3 py-2"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+372..."
                disabled={loading}
              />
            </label>

            <label className="grid gap-1 text-sm">
              {t.password}
              <input
                type="password"
                className="rounded-xl border border-slate-200 px-3 py-2"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {loading ? t.creating : t.create}
            </button>

            <div className="mt-2 text-sm text-slate-600">
              {t.already}{" "}
              <a className="font-semibold underline" href={loginHref}>
                {t.login}
              </a>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}