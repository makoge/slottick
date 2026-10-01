// components/reviews/review-share-modal.tsx
"use client";

import { useState } from "react";

type ReviewShareProps = {
  review: {
    id: string;
    rating: number;
    comment: string | null;
    clientName?: string;
  };
  businessName: string;
  businessSlug: string;
  locale?: string;
  onClose: () => void;
};

export default function ReviewShareModal({
  review,
  businessName,
  businessSlug,
  locale = "en",
  onClose,
}: ReviewShareProps) {
  const [copied, setCopied] = useState(false);

  const siteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL || "https://slottick.com"
  ).replace(/\/$/, "");
  const targetUrl = `${siteUrl}/${locale}/book/${encodeURIComponent(businessSlug)}?reviewId=${encodeURIComponent(review.id)}`;

  const stars = "★".repeat(review.rating);
  const quote = review.comment ? `“${review.comment}”` : "5-star appointment!";
  const shareTitle = `${stars} Review for ${businessName}`;
  const shareText = `${stars}\n${quote}\n\nClient praise on Slottick:`;

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
        // Fallback to copy
      }
    }
    handleCopy();
  }

  function handleWhatsAppShare() {
    const text = encodeURIComponent(
      `⭐ *New Verified Review:*\n${stars}\n${quote}\n\nSee reviews & book your slot here:\n${targetUrl}`,
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  }

  function handleXShare() {
    const text = encodeURIComponent(
      `${stars} ${quote}\n\nBook direct with ${businessName}:`,
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
          Share Review Card
        </span>

        <h3 className="mt-3 text-lg font-extrabold text-slate-900">
          Share Social Proof
        </h3>
        <p className="mt-1 text-xs text-slate-600">
          Post this verified client quote to WhatsApp Status, Instagram, or X to
          show off your work.
        </p>

        {/* Live Card Graphic Preview */}
        <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950 p-5 text-white shadow-inner">
          <div className="flex items-center justify-between">
            <span className="text-amber-400 text-sm tracking-widest">
              {stars}
            </span>
            <span className="font-mono text-[10px] text-lime-400 font-bold uppercase">
              Verified Review
            </span>
          </div>

          <p className="mt-3 text-sm italic font-medium leading-relaxed text-slate-200">
            {quote}
          </p>

          <div className="mt-4 flex items-center justify-between border-t border-slate-800 pt-3">
            <span className="font-mono text-xs text-slate-400">
              — {review.clientName || "Verified Client"}
            </span>
            <span className="font-mono text-[10px] text-slate-500">
              {businessName}
            </span>
          </div>
        </div>

        {/* Share Buttons */}
        <div className="mt-5 space-y-2.5">
          <button
            onClick={handleNativeShare}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-lime-300/80 bg-lime-100 py-3 font-mono text-xs font-bold uppercase tracking-wider text-lime-950 shadow-xs transition hover:bg-lime-200 active:scale-95"
          >
            <span>📲</span>
            <span>Share to Status / Story</span>
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
              {copied ? "✓ Copied Review Link!" : "🔗 Copy Direct Link"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
