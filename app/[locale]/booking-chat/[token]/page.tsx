"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useLocale } from "@/lib/use-locale";
import { useMessages } from "@/lib/use-messages";
import { t } from "@/lib/i18n";

type ChatMessage = {
  id: string;
  body: string;
  senderType: "BUSINESS" | "CUSTOMER" | "SYSTEM";
  createdAt: string;
};

type ChatPayload = {
  conversation: {
    id: string;
    bookingId: string;
    bookingStatus: string;
    businessName: string;
    serviceName: string;
    startsAt: string;
    customerName: string;
    messages: ChatMessage[];
  };
};

export default function BookingChatPage() {
  const params = useParams<{ token: string }>();
  const token = params?.token ?? "";
  const locale = useLocale("en");
  const messages = useMessages(locale);

  const tr = (key: string, vars?: Record<string, string | number>) => {
    let s = t(messages, key);
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        s = s.replaceAll(`{${k}}`, String(v));
      }
    }
    return s;
  };

  const [data, setData] = useState<ChatPayload["conversation"] | null>(null);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadConversation() {
    if (!token) return;
    setError(null);

    const res = await fetch(`/api/client/conversations/${encodeURIComponent(token)}`, {
      cache: "no-store"
    });
    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(json?.error || tr("bookingChat.errors.loadFailed"));
      setData(null);
      setLoading(false);
      return;
    }

    setData(json.conversation ?? null);
    setLoading(false);
  }

  async function sendMessage() {
    if (!body.trim() || sending) return;
    setSending(true);
    setError(null);

    const res = await fetch(`/api/client/conversations/${encodeURIComponent(token)}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: body.trim() })
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(json?.error || tr("bookingChat.errors.sendFailed"));
      setSending(false);
      return;
    }

    setBody("");
    await loadConversation();
    setSending(false);
  }

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (cancelled) return;
      await loadConversation();
    })();

    const id = setInterval(() => {
      loadConversation();
    }, 10000);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [token]);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h1 className="text-2xl font-bold">{tr("bookingChat.title")}</h1>

          {loading ? (
            <div className="mt-4 rounded-2xl border border-slate-200 p-4 text-sm text-slate-600">
              {tr("bookingChat.loading")}
            </div>
          ) : error ? (
            <div className="mt-4 rounded-2xl bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          ) : !data ? (
            <div className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">
              {tr("bookingChat.errors.notFound")}
            </div>
          ) : (
            <>
              <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm">
                <div>
                  <span className="text-slate-500">{tr("bookingChat.labels.business")}:</span>{" "}
                  <span className="font-semibold">{data.businessName}</span>
                </div>
                <div className="mt-1">
                  <span className="text-slate-500">{tr("bookingChat.labels.service")}:</span>{" "}
                  <span className="font-semibold">{data.serviceName}</span>
                </div>
                <div className="mt-1">
                  <span className="text-slate-500">{tr("bookingChat.labels.status")}:</span>{" "}
                  <span className="font-semibold">{data.bookingStatus}</span>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {data.messages.map((m) => {
                  const mine = m.senderType === "CUSTOMER";
                  const system = m.senderType === "SYSTEM";

                  return (
                    <div
                      key={m.id}
                      className={[
                        "rounded-2xl px-4 py-3 text-sm",
                        system
                          ? "bg-slate-100 text-slate-600"
                          : mine
                          ? "ml-auto max-w-[85%] bg-slate-900 text-white"
                          : "max-w-[85%] bg-white ring-1 ring-slate-200"
                      ].join(" ")}
                    >
                      <div>{m.body}</div>
                      <div className={`mt-2 text-xs ${mine ? "text-white/70" : "text-slate-400"}`}>
                        {new Date(m.createdAt).toLocaleString(locale)}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 space-y-3">
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder={tr("bookingChat.placeholders.message")}
                  className="min-h-[120px] w-full rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
                <button
                  type="button"
                  onClick={sendMessage}
                  disabled={sending || !body.trim()}
                  className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {sending ? tr("bookingChat.actions.sending") : tr("bookingChat.actions.send")}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}