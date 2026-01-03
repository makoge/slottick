"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type BusinessDTO = {
  name: string;
  slug: string;
  website?: string | null;
  category: string;
  city: string;
  country: string;
  ownerEmail: string;
};

export default function LoginClient({ locale }: { locale: string }) {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetRequired, setResetRequired] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    setError(null);
    setResetRequired(false);

    const safeEmail = email.trim().toLowerCase();
    if (!safeEmail) return setError("Enter your email.");
    if (!password) return setError("Enter your password.");

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: safeEmail, password })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || "Login failed");

        if (data.resetRequired) {
          setResetRequired(true);
          setPassword(""); // stop re-trying passwords
        }
        return;
      }

      const b = data.business as BusinessDTO;

      // MVP local cache (cookie is the real auth)
      localStorage.setItem(
        "slotta_account",
        JSON.stringify({
          createdAt: new Date().toISOString(),
          businessName: b.name,
          slug: b.slug,
          website: b.website ?? undefined,
          email: b.ownerEmail,
          category: b.category,
          city: b.city,
          country: b.country
        })
      );

      router.push(`/${locale}/dashboard`);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  const resetHref = `/${locale}/reset-password?email=${encodeURIComponent(
    email.trim().toLowerCase()
  )}`;

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-md px-6 py-14">
        <section className="rounded-3xl border border-slate-200 p-8 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-600">Slottick</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight">Log in</h1>
              <p className="mt-2 text-slate-600">
                Access your dashboard and manage bookings.
              </p>
            </div>

            <a className="text-sm underline text-slate-600" href={`/${locale}`}>
              Back
            </a>
          </div>

          <form onSubmit={submit} className="mt-8 grid gap-4">
            {error && (
              <div
                className={[
                  "rounded-xl px-4 py-3 text-sm",
                  resetRequired ? "bg-amber-50 text-amber-900" : "bg-red-50 text-red-700"
                ].join(" ")}
              >
                {error}
                {resetRequired ? (
                  <div className="mt-2 text-amber-800">
                    For security, this account is temporarily locked. Reset your password to continue.
                  </div>
                ) : null}
              </div>
            )}

            <label className="grid gap-1 text-sm">
              Email
              <input
                type="email"
                className="rounded-xl border border-slate-200 px-3 py-2"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                required
              />
            </label>

            <label className="grid gap-1 text-sm">
              Password
              <input
                type="password"
                className="rounded-xl border border-slate-200 px-3 py-2 disabled:opacity-60"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={resetRequired}
              />
            </label>

            <button
              type="submit"
              disabled={loading || resetRequired}
              className="mt-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {loading ? "Logging in..." : resetRequired ? "Locked" : "Log in"}
            </button>

            {resetRequired && (
              <a
                href={resetHref}
                className="rounded-xl border border-slate-200 px-6 py-3 text-center text-sm font-semibold hover:bg-slate-50"
              >
                Reset password
              </a>
            )}

            <div className="mt-2 text-sm text-slate-600">
              Don’t have an account?{" "}
              <a className="font-semibold underline" href={`/${locale}/register`}>
                Create one
              </a>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
