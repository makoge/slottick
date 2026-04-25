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
          data?.error || t(messages, "subscribe.momo.errors.requestFailed")
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
          : t(messages, "subscribe.momo.errors.generic")
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
          Origin:
            typeof window !== "undefined" ? window.location.origin : "",
        },
        body: JSON.stringify({ reference }),
      });

      const data: StatusResult & { error?: string } = await res.json();

      if (!res.ok) {
        throw new Error(
          data?.error || t(messages, "subscribe.momo.errors.statusFailed")
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
          : t(messages, "subscribe.momo.errors.statusFailed")
      );
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-white">
            {t(messages, "subscribe.momo.networkLabel")}
          </label>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setProvider("MTN_MOMO")}
              className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                provider === "MTN_MOMO"
                  ? "border-white bg-white text-slate-900"
                  : "border-white/15 bg-white/5 text-white hover:bg-white/10"
              }`}
            >
              {t(messages, "subscribe.momo.mtn")}
            </button>

            <button
              type="button"
              onClick={() => setProvider("ORANGE_MONEY")}
              className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                provider === "ORANGE_MONEY"
                  ? "border-white bg-white text-slate-900"
                  : "border-white/15 bg-white/5 text-white hover:bg-white/10"
              }`}
            >
              {t(messages, "subscribe.momo.orange")}
            </button>
          </div>
        </div>

        <div>
          <label
            htmlFor="momo-phone"
            className="mb-2 block text-sm font-medium text-white"
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
            className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-white placeholder:text-slate-400 outline-none transition focus:border-white/40"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex w-full items-center justify-center rounded-2xl bg-white px-6 py-4 text-base font-semibold text-slate-900 shadow-lg transition hover:scale-[1.01] hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading
            ? t(messages, "subscribe.momo.sending")
            : t(messages, "subscribe.momo.button")}
        </button>

        <p className="text-xs leading-6 text-slate-300">
          {t(messages, "subscribe.momo.hint")}
        </p>
      </form>

      {reference ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm font-semibold text-white">
            {t(messages, "subscribe.momo.status.title")}
          </p>

          <p className="mt-2 break-all text-xs text-slate-300">
            {t(messages, "subscribe.momo.status.reference")}: {reference}
          </p>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
  type="button"
  onClick={checkStatus}
  disabled={checking || paymentState === "success"}
  className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70"
>
  {paymentState === "success"
    ? t(messages, "subscribe.momo.status.completed")
    : checking
    ? t(messages, "subscribe.momo.status.checking")
    : t(messages, "subscribe.momo.status.check")}
</button>

            {paymentState === "pending" ? (
              <span className="rounded-xl border border-amber-300/30 bg-amber-400/10 px-3 py-2 text-xs font-medium text-amber-200">
                {t(messages, "subscribe.momo.status.pending")}
              </span>
            ) : null}

            {paymentState === "success" ? (
              <span className="rounded-xl border border-emerald-300/30 bg-emerald-400/10 px-3 py-2 text-xs font-medium text-emerald-200">
                {t(messages, "subscribe.momo.status.success")}
              </span>
            ) : null}

            {paymentState === "failed" ? (
              <span className="rounded-xl border border-red-300/30 bg-red-400/10 px-3 py-2 text-xs font-medium text-red-200">
                {t(messages, "subscribe.momo.status.failed")}
              </span>
            ) : null}
          </div>
        </div>
      ) : null}

      {message && paymentState !== "success" ? (
  <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
    {message}
  </div>
) : null}

      {error ? (
        <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}
    </div>
  );
}