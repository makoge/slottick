"use client";

import { t } from "@/lib/i18n";

type Props = {
  messages: any;
  bookingUrl: string;
  bookingPath: string;
  copied: boolean;
  onCopy: () => void;
};

export default function ShareLinkCard({
  messages,
  bookingUrl,
  bookingPath,
  copied,
  onCopy,
}: Props) {
  const fullUrl =
    bookingUrl ||
    (typeof window !== "undefined"
      ? `${window.location.origin}${bookingPath}`
      : `https://slottick.com${bookingPath}`);

  // Native share sheet (WhatsApp Status, Instagram, AirDrop, etc.)
  async function handleNativeShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "Book with us on Slottick",
          text: "Check out our services and book your appointment directly online:",
          url: fullUrl,
        });
        return;
      } catch {
        // User dismissed
      }
    }
    onCopy();
  }

  function handleWhatsAppShare() {
    const text = encodeURIComponent(
      `✨ Book your next appointment directly online with real-time availability:\n${fullUrl}`,
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  }

  function handleXShare() {
    const text = encodeURIComponent(
      `Book your appointment online with live availability:`,
    );
    window.open(
      `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(
        fullUrl,
      )}`,
      "_blank",
    );
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-400/40 bg-white/75 shadow-xl backdrop-blur-2xl">
      <div className="p-6 sm:p-8">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-md border border-lime-300/80 bg-lime-100 font-mono text-[10px] font-bold text-lime-950 shadow-2xs">
                🔗
              </span>
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-500">
                {t(messages, "dashboard.share.title")}
              </h3>
            </div>

            {/* Quick Share Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleWhatsAppShare}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white/90 px-2.5 py-1 font-mono text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 active:scale-95"
                title="Share to WhatsApp"
              >
                <span>💬</span>
                <span className="hidden sm:inline">WhatsApp</span>
              </button>
              <button
                type="button"
                onClick={handleXShare}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white/90 px-2.5 py-1 font-mono text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 active:scale-95"
                title="Post to X"
              >
                <span>𝕏</span>
                <span className="hidden sm:inline">Post</span>
              </button>
            </div>
          </div>

          <div className="mt-2 flex flex-col gap-2.5 sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 items-center rounded-2xl border border-slate-300/80 bg-white/90 px-4 py-3 shadow-2xs backdrop-blur-sm">
              <span className="truncate font-mono text-xs font-medium text-slate-900 sm:text-sm">
                {fullUrl}
              </span>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleNativeShare}
                className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-2xl border border-lime-300/80 bg-lime-100 px-4 py-3 font-mono text-xs font-bold uppercase tracking-wider text-lime-950 shadow-xs transition-all hover:bg-lime-200 active:scale-95"
                title="Share to mobile apps"
              >
                <span>📲</span>
                <span>Share</span>
              </button>

              <button
                type="button"
                onClick={onCopy}
                className="inline-flex shrink-0 items-center justify-center rounded-2xl border border-slate-300/80 bg-white px-5 py-3 font-mono text-xs font-bold uppercase tracking-wider text-slate-900 shadow-xs transition-all hover:bg-slate-50 active:scale-95"
              >
                {copied
                  ? `✓ ${t(messages, "dashboard.share.copied")}`
                  : `${t(messages, "dashboard.share.copy")}`}
              </button>
            </div>
          </div>

          <p className="mt-1 font-mono text-[11px] text-slate-500">
            {t(messages, "dashboard.share.help")}
          </p>
        </div>
      </div>

      <div className="border-t border-slate-300/70 bg-slate-100/70 px-6 py-3.5 sm:px-8">
        <p className="font-mono text-xs text-slate-600">
          💡{" "}
          <span className="font-medium text-slate-800">
            {t(messages, "dashboard.share.tip")}
          </span>
        </p>
      </div>
    </section>
  );
}
