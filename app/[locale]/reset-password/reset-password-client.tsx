"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ResetPasswordClient({
  locale,
  token,
  email,
}: {
  locale: string;
  token: string;
  email: string;
}) {
  const router = useRouter();
  const hasToken = useMemo(() => Boolean(token), [token]);

  const [addr, setAddr] = useState(email);
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function requestReset(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    setMsg(null);
    if (!addr.trim()) return setMsg("Enter your email.");

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: addr.trim().toLowerCase() }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) return setMsg(data.error || "Request failed.");

      setMsg("Check console for reset link (email sending comes next).");
    } catch {
      setMsg("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function confirmReset(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    setMsg(null);
    if (!token) return setMsg("Missing token.");
    if (newPassword.length < 6)
      return setMsg("Password must be at least 6 characters.");

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) return setMsg(data.error || "Reset failed.");

      setMsg("Password updated. You can log in now.");
      setTimeout(() => router.replace(`/${locale}/login`), 700);
    } catch {
      setMsg("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] w-full items-center justify-center px-4 py-12 sm:px-6">
      {/* Ambient background glow accents */}
      <div className="pointer-events-none absolute -top-12 h-64 w-64 rounded-full bg-lime-200/40 blur-3xl sm:h-80 sm:w-80" />
      <div className="pointer-events-none absolute -bottom-12 h-64 w-64 rounded-full bg-slate-400/30 blur-3xl sm:h-80 sm:w-80" />

      {/* Main Glassmorphic Auth Card */}
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-slate-400/40 bg-white/75 p-6 shadow-xl backdrop-blur-2xl sm:p-9">
        {/* Header Ribbon */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-300/70 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg border border-lime-300/80 bg-lime-100 font-mono text-xs font-bold text-lime-950 shadow-xs">
                ✓
              </span>
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-500">
                Slottick Security
              </span>
            </div>

            <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              Reset password
            </h1>
            <p className="mt-1 text-xs text-slate-600 sm:text-sm">
              {hasToken
                ? "Set a new password for your account."
                : "Request a reset link to your verified email."}
            </p>
          </div>

          <Link
            href={`/${locale}/login`}
            className="rounded-xl border border-slate-300/80 bg-white/80 px-3 py-1.5 font-mono text-xs font-semibold text-slate-600 shadow-2xs backdrop-blur-sm transition-all hover:bg-white hover:text-slate-950"
          >
            Back
          </Link>
        </div>

        {/* Feedback / Alert Message */}
        {msg ? (
          <div className="mt-5 rounded-2xl border border-slate-300/80 bg-slate-100/90 px-4 py-3 font-mono text-xs font-medium text-slate-800 shadow-2xs backdrop-blur-sm">
            {msg}
          </div>
        ) : null}

        {/* Request Form (No Token) */}
        {!hasToken ? (
          <form onSubmit={requestReset} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <label className="font-mono text-xs font-bold uppercase tracking-wider text-slate-700">
                Email Address
              </label>
              <input
                type="email"
                className="w-full rounded-2xl border border-slate-300/80 bg-white/90 px-4 py-3 font-mono text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:bg-white focus:outline-none"
                value={addr}
                onChange={(e) => setAddr(e.target.value)}
                placeholder="you@domain.com"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center rounded-2xl border border-lime-300/80 bg-lime-100 px-6 py-3.5 font-mono text-xs font-bold uppercase tracking-wider text-lime-950 shadow-xs transition-all hover:bg-lime-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send Reset Link →"}
            </button>

            <p className="border-t border-slate-300/60 pt-3 text-center font-mono text-[11px] text-slate-500">
              For now, the link prints in your server terminal.
            </p>
          </form>
        ) : (
          /* Confirm Reset Form (With Token) */
          <form onSubmit={confirmReset} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <label className="font-mono text-xs font-bold uppercase tracking-wider text-slate-700">
                New Password
              </label>
              <input
                type="password"
                className="w-full rounded-2xl border border-slate-300/80 bg-white/90 px-4 py-3 font-mono text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:bg-white focus:outline-none"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center rounded-2xl border border-lime-300/80 bg-lime-100 px-6 py-3.5 font-mono text-xs font-bold uppercase tracking-wider text-lime-950 shadow-xs transition-all hover:bg-lime-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Updating..." : "Update Password →"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
