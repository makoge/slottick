"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";

export default function CustomerLoginClient() {
  const router = useRouter();
  const params = useParams<{ locale?: string }>();
  const sp = useSearchParams();

  const locale = params?.locale ?? "en";
  const next = sp.get("next") || `/${locale}`;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signupHref = useMemo(
    () => `/${locale}/customer/signup?next=${encodeURIComponent(next)}`,
    [locale, next]
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    setError(null);

    const safeEmail = email.trim().toLowerCase();
    if (!safeEmail) return setError("Enter your email.");
    if (!password) return setError("Enter your password.");

    setLoading(true);
    try {
      const res = await fetch("/api/customer/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: safeEmail, password }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }

      router.push(next);
    } catch {
      setError("Network error. Try again.");
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
              <h1 className="mt-2 text-3xl font-bold tracking-tight">Customer login</h1>
              <p className="mt-2 text-slate-600">Rebook faster and track your bookings.</p>
            </div>

            <a className="text-sm underline text-slate-600" href={`/${locale}`}>
              Back
            </a>
          </div>

          {/* Social (requires NextAuth setup) */}
          <div className="mt-6 grid gap-2">
            <a
              className="rounded-xl border border-slate-200 px-4 py-3 text-center text-sm font-semibold hover:bg-slate-50"
              href={`/api/auth/signin/google?callbackUrl=${encodeURIComponent(next)}`}
            >
              Continue with Google
            </a>
            <a
              className="rounded-xl border border-slate-200 px-4 py-3 text-center text-sm font-semibold hover:bg-slate-50"
              href={`/api/auth/signin/facebook?callbackUrl=${encodeURIComponent(next)}`}
            >
              Continue with Facebook
            </a>
          </div>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <div className="text-xs text-slate-500">or</div>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <form onSubmit={submit} className="grid gap-4">
            {error && (
              <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <label className="grid gap-1 text-sm">
              Email
              <input
                type="email"
                className="rounded-xl border border-slate-200 px-3 py-2"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </label>

            <label className="grid gap-1 text-sm">
              Password
              <input
                type="password"
                className="rounded-xl border border-slate-200 px-3 py-2"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {loading ? "Logging in..." : "Log in"}
            </button>

            <div className="mt-2 text-sm text-slate-600">
              Don’t have an account?{" "}
              <a className="font-semibold underline" href={signupHref}>
                Create one
              </a>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
