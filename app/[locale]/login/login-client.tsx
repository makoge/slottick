"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";

type BusinessDTO = {
  name: string;
  slug: string;
  website?: string | null;
  category: string;
  city: string;
  country: string;
  ownerEmail: string;
};

function getLocaleFromPath(pathname: string) {
  const seg = pathname.split("/").filter(Boolean)[0];
  if (seg === "en" || seg === "fr") return seg;
  return "en";
}

export default function LoginClient() {
  const router = useRouter();
  const pathname = usePathname();

  const locale = useMemo(
    () => getLocaleFromPath(pathname || "/en"),
    [pathname],
  );

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
        credentials: "include",
        body: JSON.stringify({ email: safeEmail, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || "Login failed");
        if (data.resetRequired) {
          setResetRequired(true);
          setPassword("");
        }
        return;
      }

      const b = data.business as BusinessDTO | undefined;
      if (b?.slug) {
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
            country: b.country,
          }),
        );
      }

      router.replace(`/${locale}/dashboard`);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  const resetHref = `/${locale}/reset-password?email=${encodeURIComponent(
    email.trim().toLowerCase(),
  )}`;

  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] w-full items-center justify-center px-4 py-12 sm:px-6">
      {/* Ambient background glow accents */}
      <div className="pointer-events-none absolute -top-12 h-64 w-64 rounded-full bg-lime-200/40 blur-3xl sm:h-80 sm:w-80" />
      <div className="pointer-events-none absolute -bottom-12 h-64 w-64 rounded-full bg-slate-400/30 blur-3xl sm:h-80 sm:w-80" />

      {/* Main Glassmorphic Auth Card */}
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-slate-400/40 bg-white/70 p-6 shadow-xl backdrop-blur-2xl sm:p-9">
        {/* Header with Slottick Identity */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-300/70 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg border border-lime-300/80 bg-lime-100 font-mono text-xs font-bold text-lime-950 shadow-xs">
                ✓
              </span>
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-500">
                Slottick Account
              </span>
            </div>

            <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              Log in
            </h1>
            <p className="mt-1.5 text-xs text-slate-600 sm:text-sm">
              Access your schedule and live booking engine.
            </p>
          </div>

          <Link
            href={`/${locale}`}
            className="rounded-xl border border-slate-300/80 bg-white/80 px-3 py-1.5 font-mono text-xs font-semibold text-slate-600 shadow-2xs backdrop-blur-sm transition-all hover:bg-white hover:text-slate-950"
          >
            Back
          </Link>
        </div>

        {/* Form Body */}
        <form onSubmit={submit} className="mt-6 space-y-4">
          {error && (
            <div
              className={`rounded-2xl border p-4 text-xs font-medium backdrop-blur-md ${
                resetRequired
                  ? "border-amber-300/80 bg-amber-50/90 text-amber-900"
                  : "border-rose-300/80 bg-rose-50/90 text-rose-800"
              }`}
            >
              <div className="font-semibold">{error}</div>
              {resetRequired && (
                <div className="mt-1 text-amber-800">
                  For security, this account is temporarily locked. Reset your
                  password to continue.
                </div>
              )}
            </div>
          )}

          {/* Email Input */}
          <div className="space-y-1.5">
            <label className="font-mono text-xs font-bold uppercase tracking-wider text-slate-700">
              Email Address
            </label>
            <input
              type="email"
              className="w-full rounded-2xl border border-slate-300/80 bg-white/90 px-4 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:bg-white focus:outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@business.com"
              required
            />
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-mono text-xs font-bold uppercase tracking-wider text-slate-700">
                Password
              </label>
              {email.trim() && (
                <Link
                  href={resetHref}
                  className="font-mono text-[11px] font-semibold text-slate-500 hover:text-slate-900 hover:underline"
                >
                  Forgot?
                </Link>
              )}
            </div>
            <input
              type="password"
              className="w-full rounded-2xl border border-slate-300/80 bg-white/90 px-4 py-3 font-mono text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:bg-white focus:outline-none disabled:opacity-50"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              disabled={resetRequired}
            />
          </div>

          {/* Actions */}
          <button
            type="submit"
            disabled={loading || resetRequired}
            className="mt-2 flex w-full items-center justify-center rounded-2xl border border-lime-300/80 bg-lime-100 px-6 py-3.5 font-mono text-xs font-bold uppercase tracking-wider text-lime-950 shadow-xs transition-all hover:bg-lime-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Verifying..."
              : resetRequired
                ? "Account Locked"
                : "Log In to Dashboard"}
          </button>

          {resetRequired && (
            <Link
              href={resetHref}
              className="block w-full rounded-2xl border border-slate-300/80 bg-white/80 px-6 py-3 text-center font-mono text-xs font-bold uppercase tracking-wider text-slate-800 shadow-2xs backdrop-blur-sm transition-all hover:bg-white active:scale-95"
            >
              Reset Password
            </Link>
          )}

          {/* Footer Navigation */}
          <div className="border-t border-slate-300/60 pt-4 text-center text-xs text-slate-600">
            Don’t have an account?{" "}
            <Link
              className="font-bold text-slate-900 underline underline-offset-2 hover:text-black"
              href={`/${locale}/register`}
            >
              Create one free
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
