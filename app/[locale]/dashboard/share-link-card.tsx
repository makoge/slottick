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
  return (
    <section className="overflow-hidden rounded-3xl border border-slate-400/40 bg-white/75 shadow-xl backdrop-blur-2xl">
      <div className="p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-md border border-lime-300/80 bg-lime-100 font-mono text-[10px] font-bold text-lime-950 shadow-2xs">
                🔗
              </span>
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-500">
                {t(messages, "dashboard.share.title")}
              </h3>
            </div>

            <div className="mt-4 flex flex-col gap-2.5 sm:flex-row sm:items-center">
              <div className="flex min-w-0 flex-1 items-center rounded-2xl border border-slate-300/80 bg-white/90 px-4 py-3 shadow-2xs backdrop-blur-sm">
                <span className="truncate font-mono text-xs font-medium text-slate-900 sm:text-sm">
                  {bookingUrl || bookingPath}
                </span>
              </div>

              <button
                type="button"
                onClick={onCopy}
                className="inline-flex shrink-0 items-center justify-center rounded-2xl border border-lime-300/80 bg-lime-100 px-6 py-3 font-mono text-xs font-bold uppercase tracking-wider text-lime-950 shadow-xs transition-all hover:bg-lime-200 active:scale-95"
              >
                {copied
                  ? `✓ ${t(messages, "dashboard.share.copied")}`
                  : `${t(messages, "dashboard.share.copy")} →`}
              </button>
            </div>

            <p className="mt-3 font-mono text-[11px] text-slate-500">
              {t(messages, "dashboard.share.help")}
            </p>
          </div>
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
