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
  onCopy
}: Props) {
  return (
    <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="text-sm font-medium text-slate-600">
            {t(messages, "dashboard.share.title")}
          </div>

          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1 rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 ring-1 ring-slate-200">
              <div className="truncate">{bookingUrl || bookingPath}</div>
            </div>

            <button
              type="button"
              onClick={onCopy}
              className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
            >
              {copied
                ? t(messages, "dashboard.share.copied")
                : t(messages, "dashboard.share.copy")}
            </button>
          </div>

          <div className="mt-2 text-sm text-slate-500">
            {t(messages, "dashboard.share.help")}
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200 bg-slate-50 px-6 py-4 text-sm text-slate-600">
        {t(messages, "dashboard.share.tip")}
      </div>
    </section>
  );
}