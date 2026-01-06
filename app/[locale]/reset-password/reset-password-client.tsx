"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false }
};


export default function ResetPasswordClient({
  locale,
  token,
  email
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
        body: JSON.stringify({ email: addr.trim().toLowerCase() })
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
    if (newPassword.length < 6) return setMsg("Password must be at least 6 characters.");

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword })
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
    <main className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-md px-6 py-14">
        <section className="rounded-3xl border border-slate-200 p-8 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-600">Slotta</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight">
                Reset password
              </h1>
              <p className="mt-2 text-slate-600">
                {hasToken
                  ? "Set a new password for your account."
                  : "Request a reset link to your email (placeholder: console)."}
              </p>
            </div>

            <a className="text-sm underline text-slate-600" href={`/${locale}/login`}>
              Back
            </a>
          </div>

          {msg ? (
            <div className="mt-6 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
              {msg}
            </div>
          ) : null}

          {!hasToken ? (
            <form onSubmit={requestReset} className="mt-8 grid gap-4">
              <label className="grid gap-1 text-sm">
                Email
                <input
                  className="rounded-xl border border-slate-200 px-3 py-2"
                  type="email"
                  value={addr}
                  onChange={(e) => setAddr(e.target.value)}
                  placeholder="you@domain.com"
                  required
                />
              </label>

              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {loading ? "Sending..." : "Send reset link"}
              </button>

              <p className="text-xs text-slate-500">
                For now, the link prints in your terminal. Next step: real email.
              </p>
            </form>
          ) : (
            <form onSubmit={confirmReset} className="mt-8 grid gap-4">
              <label className="grid gap-1 text-sm">
                New password
                <input
                  className="rounded-xl border border-slate-200 px-3 py-2"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </label>

              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {loading ? "Updating..." : "Update password"}
              </button>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}
