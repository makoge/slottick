"use client";

import { useState } from "react";

type ShareData = {
  title: string;
  text: string;
  url: string;
  serviceName?: string;
  price?: number;
  currency?: string;
};

export default function SocialShareMenu({ data }: { data: ShareData }) {
  const [copied, setCopied] = useState(false);

  // 1. Native Web Share (opens mobile OS share sheet: WhatsApp, IG, X, etc.)
  async function handleNativeShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: data.title,
          text: data.text,
          url: data.url,
        });
        return;
      } catch (err) {
        // User canceled or fallback
      }
    }
    handleCopyLink();
  }

  // 2. Direct WhatsApp Click
  function shareToWhatsApp() {
    const message = encodeURIComponent(
      `${data.text}\n\n👉 Book your slot here: ${data.url}`,
    );
    window.open(`https://api.whatsapp.com/send?text=${message}`, "_blank");
  }

  // 3. Direct X / Twitter Click
  function shareToX() {
    const text = encodeURIComponent(`${data.text}\n\nBook direct on Slottick:`);
    window.open(
      `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(data.url)}`,
      "_blank",
    );
  }

  // 4. Quick Copy Link with visual feedback
  function handleCopyLink() {
    navigator.clipboard.writeText(data.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Primary Mobile Native Share */}
      <button
        onClick={handleNativeShare}
        className="inline-flex items-center gap-1.5 rounded-xl border border-lime-300/80 bg-lime-100 px-3.5 py-2 text-xs font-bold text-lime-950 shadow-xs transition hover:bg-lime-200 active:scale-95"
      >
        <span>📲</span>
        <span>Share to Status / Story</span>
      </button>

      {/* WhatsApp Direct */}
      <button
        onClick={shareToWhatsApp}
        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white/80 px-3 py-2 text-xs font-semibold text-slate-800 shadow-xs transition hover:bg-slate-100 active:scale-95"
      >
        <span>💬</span>
        <span>WhatsApp</span>
      </button>

      {/* X / Threads */}
      <button
        onClick={shareToX}
        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white/80 px-3 py-2 text-xs font-semibold text-slate-800 shadow-xs transition hover:bg-slate-100 active:scale-95"
      >
        <span>𝕏</span>
        <span>Post</span>
      </button>

      {/* Copy Link */}
      <button
        onClick={handleCopyLink}
        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
      >
        <span>{copied ? "✓ Copied!" : "🔗 Copy Link"}</span>
      </button>
    </div>
  );
}
