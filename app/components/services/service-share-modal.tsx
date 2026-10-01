// components/services/service-share-modal.tsx
"use client";

import { useState } from "react";
import { Currency, formatMoney } from "@/lib/services";

type ShareModalProps = {
  service: {
    id: string;
    name: string;
    price: number;
    currency: string;
    durationMin: number;
    images?: string[];
  };
  businessSlug?: string;
  locale?: string;
  onClose: () => void;
};

// Helper to safely convert any string to Currency
function toCurrency(x: unknown): Currency {
  const s = String(x ?? "EUR").toUpperCase();
  return s === "EUR" || s === "USD" || s === "FCFA" ? (s as Currency) : "EUR";
}

export default function ServiceShareModal({
  service,
  businessSlug = "",
  locale = "en",
  onClose,
}: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  const siteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL || "https://slottick.com"
  ).replace(/\/$/, "");
  const targetUrl = `${siteUrl}/${locale}/book/${encodeURIComponent(businessSlug)}?service=${encodeURIComponent(service.id)}`;

  const heroImage = service.images?.[0] || null;
  const shareTitle = `${service.name} • ${formatMoney(service.price, toCurrency(service.price))}`;
  const shareText = `Book your ${service.name} appointment directly on Slottick (${service.durationMin} min • ${formatMoney(service.price, toCurrency(service.currency))}):`;

  async function handleNativeShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: targetUrl,
        });
        return;
      } catch {
        // Fallback to copy if user dismisses native sheet
      }
    }
    handleCopy();
  }

  function handleWhatsAppShare() {
    const text = encodeURIComponent(
      `✨ *${service.name}*\n⏱ ${service.durationMin} mins • 🏷 ${formatMoney(service.price, toCurrency(service.currency))}\n\nBook your slot directly here:\n${targetUrl}`,
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  }

  function handleXShare() {
    const text = encodeURIComponent(
      `Book ${service.name} (${formatMoney(service.price, toCurrency(service.currency))}) directly on Slottick:`,
    );
    window.open(
      `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(targetUrl)}`,
      "_blank",
    );
  }

  function handleCopy() {
    navigator.clipboard.writeText(targetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-3xl border border-slate-300 bg-white p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 font-mono text-xs font-bold text-slate-600 hover:bg-slate-200"
        >
          ✕
        </button>

        <span className="inline-flex items-center gap-1.5 rounded-full border border-lime-300/80 bg-lime-100 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-lime-950">
          <span className="h-1.5 w-1.5 rounded-full bg-lime-700" />
          Share Service Card
        </span>

        <h3 className="mt-3 text-lg font-extrabold text-slate-900">
          Promote on Social Media
        </h3>
        <p className="mt-1 text-xs text-slate-600">
          Share this card on WhatsApp Status, Instagram, or X to let clients
          book this service in one tap.
        </p>

        {/* Live Card Preview */}
        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-3 shadow-xs">
          <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-slate-200">
            {heroImage ? (
              <img
                src={heroImage}
                alt={service.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center font-mono text-xs font-bold text-slate-400">
                Slottick Verified Service
              </div>
            )}
            <div className="absolute bottom-2 right-2 rounded-lg bg-black/70 px-2 py-0.5 font-mono text-xs font-bold text-white backdrop-blur-xs">
              {formatMoney(service.price, toCurrency(service.currency))}
            </div>
          </div>
          <div className="mt-2.5 flex items-center justify-between">
            <span className="font-bold text-slate-900 text-sm truncate">
              {service.name}
            </span>
            <span className="font-mono text-[11px] text-slate-500 shrink-0">
              {service.durationMin} min
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-5 space-y-2.5">
          <button
            onClick={handleNativeShare}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-lime-300/80 bg-lime-100 py-3 font-mono text-xs font-bold uppercase tracking-wider text-lime-950 shadow-xs transition hover:bg-lime-200 active:scale-95"
          >
            <span>📲</span>
            <span>Share to Story / WhatsApp Status</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleWhatsAppShare}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2.5 font-mono text-xs font-semibold text-slate-800 transition hover:bg-slate-50"
            >
              <span>💬</span>
              <span>WhatsApp</span>
            </button>
            <button
              onClick={handleXShare}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2.5 font-mono text-xs font-semibold text-slate-800 transition hover:bg-slate-50"
            >
              <span>𝕏</span>
              <span>Post to X</span>
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-slate-100 py-2.5 font-mono text-xs font-semibold text-slate-700 transition hover:bg-slate-200"
          >
            <span>
              {copied ? "✓ Copied Direct Link!" : "🔗 Copy Direct Booking Link"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
