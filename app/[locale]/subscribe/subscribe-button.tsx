"use client";

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
  const onClick = async () => {
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, locale, userId }),
    });

    const data = await res.json();
    window.location.href = data.url;
  };

  return (
    <button
      onClick={onClick}
      className="inline-flex w-full items-center justify-center rounded-2xl bg-white px-6 py-4 text-base font-semibold text-slate-900 shadow-lg transition hover:scale-[1.01] hover:bg-slate-100"
    >
      {t(messages, "subscribe.card.button")}
    </button>
  );
}