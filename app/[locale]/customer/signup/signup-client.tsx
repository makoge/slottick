"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function CustomerSignupClient() {
  const router = useRouter();
  const params = useParams<{ locale?: string }>();
  const sp = useSearchParams();

  const locale = params?.locale ?? "en";
  const next = sp.get("next") || `/${locale}`;

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
    if (!name.trim()) return setError("Enter your name.");
    if (!e1 || !isValidEmail(e1)) return setError("Enter a valid email.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");

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
        setError(data.error || "Signup failed");
        return;
      }

      // logged in via cookie -> go next
      router.push(next);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  // OAuth buttons are UI-only unless you add NextAuth (below)
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-md px-6 py-14">
        <section className="rounded-3xl border border-slate-200 p-8 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-600">Slottick</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight">Create account</h1>
              <p className="mt-2 text-slate-600">
                Save bookings, rebook faster, and discover services near you.
              </p>
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
              Full name
              <input
                className="rounded-xl border border-slate-200 px-3 py-2"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required
                disabled={loading}
              />
            </label>

            <label className="grid gap-1 text-sm">
              Email
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
              Phone (optional)
              <input
                className="rounded-xl border border-slate-200 px-3 py-2"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+372..."
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
              {loading ? "Creating..." : "Create account"}
            </button>

            <div className="mt-2 text-sm text-slate-600">
              Already have an account?{" "}
              <a className="font-semibold underline" href={loginHref}>
                Log in
              </a>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
