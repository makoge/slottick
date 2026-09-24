"use client";

import { useState } from "react";
import { t } from "@/lib/i18n";

export function SubscribeButton({
  email,
  locale,
  userId,
  messages,
}: {
  email?: string;
  locale: string;
  userId: string;
  messages: any;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onClick = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, locale, userId }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.url) {
        throw new Error(
          data?.error || "Failed to initialize checkout session.",
        );
      }

      window.location.href = data.url;
    } catch (err: any) {
      setError(err?.message || "Checkout connection failed.");
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-2">
      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        className="inline-flex w-full items-center justify-center rounded-2xl border border-lime-300/80 bg-lime-100 px-6 py-3.5 font-mono text-xs font-bold uppercase tracking-wider text-lime-950 shadow-xs transition-all hover:bg-lime-200 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-lime-950 border-t-transparent" />
            <span>Connecting...</span>
          </span>
        ) : (
          <span>{t(messages, "subscribe.card.button")} →</span>
        )}
      </button>

      {error && (
        <div className="rounded-xl border border-rose-300/80 bg-rose-50/90 px-3.5 py-2 font-mono text-xs font-semibold text-rose-800 shadow-2xs">
          ✕ {error}
        </div>
      )}
    </div>
  );
}
