"use client";

import { useState } from "react";
import { t } from "@/lib/i18n";

type Provider = "MTN_MOMO" | "ORANGE_MONEY";

type StatusResult = {
  ok?: boolean;
  normalizedStatus?: "PENDING" | "SUCCESS" | "FAILED" | "EXPIRED" | "CANCELED";
  providerStatus?: string;
  reference?: string;
};

export function MobileMoneySubscribe({
  businessId,
  messages,
}: {
  businessId: string;
  messages: any;
}) {
  const [provider, setProvider] = useState<Provider>("MTN_MOMO");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);
  const [paymentState, setPaymentState] = useState<
    "idle" | "pending" | "success" | "failed"
  >("idle");

  const normalizePhone = (value: string) => value.replace(/[^\d+]/g, "").trim();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const cleanedPhone = normalizePhone(phone);

      if (!cleanedPhone) {
        throw new Error(t(messages, "subscribe.momo.errors.phoneRequired"));
      }

      const res = await fetch("/api/billing/momo/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          businessId,
          provider,
          phone: cleanedPhone,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data?.error || t(messages, "subscribe.momo.errors.requestFailed"),
        );
      }

      setReference(data?.externalReference || null);
      setPaymentState("pending");
      setMessage(data?.message || t(messages, "subscribe.momo.success"));
      setError(null);
    } catch (err) {
      setPaymentState("failed");
      setError(
        err instanceof Error
          ? err.message
          : t(messages, "subscribe.momo.errors.generic"),
      );
    } finally {
      setLoading(false);
    }
  };

  const checkStatus = async () => {
    if (!reference) return;

    setChecking(true);
    setError(null);

    try {
      const res = await fetch("/api/billing/momo/status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: typeof window !== "undefined" ? window.location.origin : "",
        },
        body: JSON.stringify({ reference }),
      });

      const data: StatusResult & { error?: string } = await res.json();

      if (!res.ok) {
        throw new Error(
          data?.error || t(messages, "subscribe.momo.errors.statusFailed"),
        );
      }

      if (data.normalizedStatus === "SUCCESS") {
        setPaymentState("success");
        setMessage(t(messages, "subscribe.momo.status.success"));
        setError(null);
        return;
      }

      if (
        data.normalizedStatus === "FAILED" ||
        data.normalizedStatus === "EXPIRED" ||
        data.normalizedStatus === "CANCELED"
      ) {
        setPaymentState("failed");
        setError(t(messages, "subscribe.momo.status.failed"));
        return;
      }

      setPaymentState("pending");
      setMessage(t(messages, "subscribe.momo.status.pending"));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t(messages, "subscribe.momo.errors.statusFailed"),
      );
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="space-y-5 rounded-3xl border border-slate-400/40 bg-white/75 p-6 shadow-xl backdrop-blur-2xl sm:p-8">
      {/* Top Header Badge */}
      <div className="border-b border-slate-300/70 pb-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-lime-300/80 bg-lime-100 px-3 py-0.5 text-xs font-bold text-lime-950 shadow-2xs">
          <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-lime-900 text-[9px] text-white">
            ✓
          </span>
          <span className="font-mono text-[10px] uppercase tracking-wider">
            Mobile Money Direct Gateway
          </span>
        </div>
        <h3 className="mt-2 text-lg font-extrabold tracking-tight text-slate-900 sm:text-xl">
          Direct Payment Setup
        </h3>
        <p className="mt-1 font-mono text-xs text-slate-600">
          Subscribe instantly via regional mobile wallet infrastructure.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        {/* Network Provider Selector */}
        <div className="space-y-2">
          <label className="font-mono text-xs font-bold uppercase tracking-wider text-slate-700">
            {t(messages, "subscribe.momo.networkLabel")}
          </label>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setProvider("MTN_MOMO")}
              className={`rounded-2xl border p-3.5 font-mono text-xs font-bold uppercase tracking-wider transition-all active:scale-95 ${
                provider === "MTN_MOMO"
                  ? "border-lime-300/90 bg-lime-100 text-lime-950 shadow-xs ring-1 ring-lime-400/50"
                  : "border-slate-300/80 bg-white/80 text-slate-700 hover:border-slate-400 hover:bg-white"
              }`}
            >
              {t(messages, "subscribe.momo.mtn")}
            </button>

            <button
              type="button"
              onClick={() => setProvider("ORANGE_MONEY")}
              className={`rounded-2xl border p-3.5 font-mono text-xs font-bold uppercase tracking-wider transition-all active:scale-95 ${
                provider === "ORANGE_MONEY"
                  ? "border-lime-300/90 bg-lime-100 text-lime-950 shadow-xs ring-1 ring-lime-400/50"
                  : "border-slate-300/80 bg-white/80 text-slate-700 hover:border-slate-400 hover:bg-white"
              }`}
            >
              {t(messages, "subscribe.momo.orange")}
            </button>
          </div>
        </div>

        {/* Phone Input Field */}
        <div className="space-y-1.5">
          <label
            htmlFor="momo-phone"
            className="font-mono text-xs font-bold uppercase tracking-wider text-slate-700"
          >
            {t(messages, "subscribe.momo.phoneLabel")}
          </label>

          <input
            id="momo-phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder={t(messages, "subscribe.momo.phonePlaceholder")}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="h-11 w-full rounded-2xl border border-slate-300/80 bg-white/90 px-4 font-mono text-sm font-semibold text-slate-900 shadow-2xs outline-none transition focus:border-slate-800 focus:bg-white"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="inline-flex w-full items-center justify-center rounded-2xl border border-lime-300/80 bg-lime-100 px-6 py-3.5 font-mono text-xs font-bold uppercase tracking-wider text-lime-950 shadow-xs transition-all hover:bg-lime-200 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading
            ? t(messages, "subscribe.momo.sending")
            : `${t(messages, "subscribe.momo.button")} →`}
        </button>

        <p className="font-mono text-[11px] leading-relaxed text-slate-500">
          {t(messages, "subscribe.momo.hint")}
        </p>
      </form>

      {/* Transaction Status Tracker */}
      {reference && (
        <div className="rounded-2xl border border-slate-300/80 bg-slate-100/70 p-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-700">
              {t(messages, "subscribe.momo.status.title")}
            </span>
            <span className="rounded-md border border-slate-300/80 bg-white px-2 py-0.5 font-mono text-[10px] font-bold text-slate-700 shadow-2xs">
              Live Reference
            </span>
          </div>

          <p className="mt-2 break-all font-mono text-xs text-slate-600">
            {t(messages, "subscribe.momo.status.reference")}:{" "}
            <span className="font-bold text-slate-900">{reference}</span>
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={checkStatus}
              disabled={checking || paymentState === "success"}
              className="rounded-xl border border-slate-300/80 bg-white px-3.5 py-1.5 font-mono text-xs font-bold text-slate-800 shadow-2xs transition hover:bg-slate-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {paymentState === "success"
                ? `✓ ${t(messages, "subscribe.momo.status.completed")}`
                : checking
                  ? t(messages, "subscribe.momo.status.checking")
                  : `${t(messages, "subscribe.momo.status.check")} ⟳`}
            </button>

            {paymentState === "pending" && (
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300/80 bg-amber-100 px-3 py-1.5 font-mono text-xs font-bold text-amber-950">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-600" />
                {t(messages, "subscribe.momo.status.pending")}
              </span>
            )}

            {paymentState === "success" && (
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-lime-300/80 bg-lime-100 px-3 py-1.5 font-mono text-xs font-bold text-lime-950">
                <span>✓</span>
                {t(messages, "subscribe.momo.status.success")}
              </span>
            )}

            {paymentState === "failed" && (
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-rose-300/80 bg-rose-50 px-3 py-1.5 font-mono text-xs font-bold text-rose-700">
                <span>✕</span>
                {t(messages, "subscribe.momo.status.failed")}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Messages & Alerts */}
      {message && paymentState !== "success" && (
        <div className="rounded-2xl border border-lime-300/80 bg-lime-50/90 p-3.5 font-mono text-xs font-semibold text-lime-950 shadow-2xs">
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-rose-300/80 bg-rose-50/90 p-3.5 font-mono text-xs font-bold text-rose-800 shadow-2xs">
          ✕ {error}
        </div>
      )}
    </div>
  );
}
