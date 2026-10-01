"use client";

import { useState } from "react";

type ShareModalProps = {
  title: string;
  url: string;
  cityName?: string;
  price?: string;
  imageUrl?: string;
};

export function ShareCardButton({
  title,
  url,
  cityName,
  price,
  imageUrl,
}: ShareModalProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Preview card URL
  const ogCardUrl = `/api/og?${new URLSearchParams({
    title,
    city: cityName || "",
    price: price || "",
    image: imageUrl || "",
    subtitle: "Check available calendar slots & book instantly.",
  }).toString()}`;

  const defaultShareText = `📅 Book your next appointment with ${title}! Check live openings and reserve your spot here: ${url}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: defaultShareText,
          url,
        });
      } catch {
        // cancelled by user
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white/80 px-3.5 py-2 text-xs font-semibold text-slate-800 shadow-xs backdrop-blur-md transition hover:bg-white hover:text-slate-950"
      >
        <span>📤</span> Share Card
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4">
              <h3 className="font-extrabold text-slate-900 text-lg">
                Share Marketing Card
              </h3>
              <button
                onClick={() => setOpen(false)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {/* Generated Card Preview */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm bg-slate-900">
              <img
                src={ogCardUrl}
                alt="Social Card Preview"
                className="w-full aspect-[1200/630] object-cover"
              />
            </div>

            {/* Quick Share Grid */}
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {/* WhatsApp */}
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(defaultShareText)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-slate-50 py-3 text-xs font-bold text-slate-700 transition hover:bg-lime-50 hover:border-lime-300"
              >
                <span className="text-xl">💬</span> WhatsApp
              </a>

              {/* X / Twitter */}
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(defaultShareText)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-slate-50 py-3 text-xs font-bold text-slate-700 transition hover:bg-slate-100"
              >
                <span className="text-xl">𝕏</span> Post
              </a>

              {/* Download Card for Instagram / WhatsApp Status */}
              <a
                href={ogCardUrl}
                download={`${title.toLowerCase().replace(/\s+/g, "-")}-card.png`}
                className="flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-slate-50 py-3 text-xs font-bold text-slate-700 transition hover:bg-slate-100"
              >
                <span className="text-xl">📥</span> Save Card
              </a>

              {/* Native System Share */}
              <button
                onClick={handleNativeShare}
                className="flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-slate-50 py-3 text-xs font-bold text-slate-700 transition hover:bg-slate-100"
              >
                <span className="text-xl">📱</span> More
              </button>
            </div>

            {/* Copy Link Input */}
            <div className="mt-5 flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2">
              <input
                type="text"
                readOnly
                value={url}
                className="w-full bg-transparent px-2 text-xs font-medium text-slate-700 outline-none"
              />
              <button
                onClick={handleCopyLink}
                className="shrink-0 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-slate-800"
              >
                {copied ? "Copied! ✓" : "Copy"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
