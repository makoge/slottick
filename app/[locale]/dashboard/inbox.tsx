"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale } from "@/lib/use-locale";
import { useMessages } from "@/lib/use-messages";
import { t } from "@/lib/i18n";
import { useSearchParams, useParams } from "next/navigation";

type ConversationListItem = {
  id: string;
  bookingId: string;
  bookingStatus: string;
  startsAt: string;
  customerName: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
  serviceName: string;
  lastMessageAt: string | null;
  lastMessage: {
    id: string;
    body: string;
    senderType: "BUSINESS" | "CUSTOMER" | "SYSTEM";
    createdAt: string;
  } | null;
  unreadCount: number;
};

type ConversationMessage = {
  id: string;
  body: string;
  senderType: "BUSINESS" | "CUSTOMER" | "SYSTEM";
  isRead: boolean;
  createdAt: string;
};

type ActiveConversation = {
  id: string;
  bookingId: string;
  booking: {
    id: string;
    status: string;
    startsAt: string;
    durationMin: number;
    serviceName: string;
    price: number;
    currency: string;
    customerName: string;
    customerEmail?: string | null;
    customerPhone?: string | null;
    notes?: string | null;
    respondedAt?: string | null;
    statusUpdatedAt?: string | null;
  };
  messages: ConversationMessage[];
};

function statusTone(status: string) {
  switch (status) {
    case "PENDING":
      return "border-amber-300/80 bg-amber-100 text-amber-950";
    case "NEEDS_INFO":
      return "border-blue-300/80 bg-blue-100 text-blue-950";
    case "CONFIRMED":
      return "border-lime-300/80 bg-lime-100 text-lime-950";
    case "DECLINED":
    case "CANCELLED":
      return "border-rose-300/80 bg-rose-100 text-rose-950";
    case "DONE":
      return "border-slate-300/80 bg-slate-100 text-slate-800";
    default:
      return "border-slate-300/80 bg-slate-100 text-slate-800";
  }
}

function formatMoney(amount: number, currency: string, locale: string) {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
    }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}

export default function Inbox() {
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

  function formatDateTime(iso?: string | null) {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  }

  function prettyStatus(status: string) {
    const key = status.toLowerCase();
    return tr(`inbox.status.${key}`);
  }

  const searchParams = useSearchParams();
  const params = useParams();

  const queryConversationId = searchParams.get("conversation") ?? "";
  const pathConversationId =
    typeof params?.conversationId === "string" ? params.conversationId : "";

  const initialConversationId = pathConversationId || queryConversationId || "";

  const [activeId, setActiveId] = useState<string>(initialConversationId);
  const [items, setItems] = useState<ConversationListItem[]>([]);
  const [active, setActive] = useState<ActiveConversation | null>(null);

  useEffect(() => {
    if (initialConversationId) {
      setActiveId(initialConversationId);
    }
  }, [initialConversationId]);

  const [loadingList, setLoadingList] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function loadList(keepSelection = true) {
    try {
      if (!keepSelection) setLoadingList(true);

      const res = await fetch("/api/dashboard/conversations", {
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error || tr("inbox.errors.loadInbox"));
      }

      const nextItems: ConversationListItem[] = Array.isArray(
        data?.conversations,
      )
        ? data.conversations
        : [];

      setItems(nextItems);

      if (!keepSelection) {
        const firstId = nextItems[0]?.id ?? "";
        setActiveId((prev) => prev || firstId);
      } else if (activeId && !nextItems.some((x) => x.id === activeId)) {
        setActiveId(nextItems[0]?.id ?? "");
      }
    } catch (err: any) {
      setError(err?.message || tr("inbox.errors.loadInbox"));
    } finally {
      setLoadingList(false);
    }
  }

  async function loadThread(conversationId: string) {
    if (!conversationId) {
      setActive(null);
      return;
    }

    try {
      setLoadingThread(true);

      const res = await fetch(
        `/api/dashboard/conversations/${encodeURIComponent(conversationId)}`,
        { cache: "no-store" },
      );
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error || tr("inbox.errors.loadConversation"));
      }

      setActive(data.conversation ?? null);
    } catch (err: any) {
      setError(err?.message || tr("inbox.errors.loadConversation"));
    } finally {
      setLoadingThread(false);
    }
  }

  async function sendMessage() {
    if (!activeId || !message.trim() || sending) return;

    try {
      setSending(true);
      setError(null);

      const res = await fetch(
        `/api/dashboard/conversations/${encodeURIComponent(activeId)}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body: message.trim() }),
        },
      );

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || tr("inbox.errors.sendMessage"));
      }

      setMessage("");
      await Promise.all([loadThread(activeId), loadList()]);
    } catch (err: any) {
      setError(err?.message || tr("inbox.errors.sendMessage"));
    } finally {
      setSending(false);
    }
  }

  useEffect(() => {
    loadList(false);
  }, []);

  useEffect(() => {
    if (activeId) loadThread(activeId);
    else setActive(null);
  }, [activeId]);

  useEffect(() => {
    const id = setInterval(() => {
      loadList();
      if (activeId) loadThread(activeId);
    }, 10000);

    return () => clearInterval(id);
  }, [activeId]);

  const selectedSummary = useMemo(
    () => items.find((x) => x.id === activeId) ?? null,
    [items, activeId],
  );

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      {/* LEFT: THREAD LIST */}
      <div className="lg:col-span-4">
        <div className="overflow-hidden rounded-3xl border border-slate-400/40 bg-white/70 shadow-sm backdrop-blur-xl">
          <div className="border-b border-slate-300/70 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-md border border-lime-300/80 bg-lime-100 font-mono text-[10px] font-bold text-lime-950">
                    💬
                  </span>
                  <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-500">
                    {tr("inbox.title")}
                  </h3>
                </div>
                <p className="mt-1 text-xs text-slate-600 sm:text-sm">
                  {tr("inbox.subtitle")}
                </p>
              </div>

              <span className="rounded-xl border border-slate-300/80 bg-white px-2.5 py-1 font-mono text-xs font-bold text-slate-800 shadow-2xs">
                {items.length}
              </span>
            </div>
          </div>

          <div className="max-h-[72vh] overflow-y-auto p-2 sm:p-3">
            {loadingList ? (
              <div className="flex items-center justify-center p-8 font-mono text-xs text-slate-500 animate-pulse">
                {tr("inbox.loading")}
              </div>
            ) : items.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300/80 bg-slate-100/50 p-6 text-center font-mono text-xs text-slate-500">
                {tr("inbox.empty")}
              </div>
            ) : (
              <div className="space-y-2">
                {items.map((item) => {
                  const activeRow = item.id === activeId;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setError(null);
                        setActiveId(item.id);
                      }}
                      className={[
                        "w-full rounded-2xl border p-3.5 text-left transition-all active:scale-[0.99]",
                        activeRow
                          ? "border-lime-300/90 bg-lime-100 text-lime-950 shadow-xs"
                          : "border-slate-300/70 bg-white/80 text-slate-800 hover:border-slate-400 hover:bg-white",
                      ].join(" ")}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-bold">
                            {item.customerName}
                          </div>
                          <div
                            className={[
                              "mt-0.5 truncate font-mono text-xs",
                              activeRow ? "text-lime-900/80" : "text-slate-600",
                            ].join(" ")}
                          >
                            {item.serviceName}
                          </div>
                        </div>

                        <div className="flex shrink-0 flex-col items-end gap-1.5">
                          <span
                            className={`rounded-lg border px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${statusTone(
                              item.bookingStatus,
                            )}`}
                          >
                            {prettyStatus(item.bookingStatus)}
                          </span>

                          {item.unreadCount > 0 ? (
                            <span className="rounded-md border border-lime-300/80 bg-lime-200 px-1.5 py-0.5 font-mono text-[10px] font-bold text-lime-950">
                              {item.unreadCount} new
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-black/5 pt-2">
                        <div
                          className={[
                            "min-w-0 truncate text-xs",
                            activeRow
                              ? "text-lime-950 font-medium"
                              : "text-slate-500",
                          ].join(" ")}
                        >
                          {item.lastMessage?.body || tr("inbox.noMessages")}
                        </div>
                        <div
                          className={[
                            "shrink-0 font-mono text-[10px]",
                            activeRow ? "text-lime-900/70" : "text-slate-400",
                          ].join(" ")}
                        >
                          {formatDateTime(item.lastMessageAt || item.startsAt)}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT: ACTIVE THREAD & DETAILS */}
      <div className="lg:col-span-8">
        <div className="flex min-h-[72vh] flex-col overflow-hidden rounded-3xl border border-slate-400/40 bg-white/75 shadow-xl backdrop-blur-2xl">
          {!activeId ? (
            <div className="flex flex-1 items-center justify-center p-8 text-center font-mono text-xs text-slate-500">
              {tr("inbox.selectConversation")}
            </div>
          ) : loadingThread && !active ? (
            <div className="flex flex-1 items-center justify-center p-8 font-mono text-xs text-slate-500 animate-pulse">
              {tr("inbox.loadingConversation")}
            </div>
          ) : !active ? (
            <div className="flex flex-1 items-center justify-center p-8 font-mono text-xs text-slate-500">
              {tr("inbox.conversationNotFound")}
            </div>
          ) : (
            <>
              {/* Thread Info Header */}
              <div className="border-b border-slate-300/70 p-5 sm:p-6">
                <div className="flex flex-col gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
                        {active.booking.customerName}
                      </h3>
                      <span
                        className={`rounded-lg border px-2.5 py-0.5 font-mono text-xs font-bold uppercase tracking-wider ${statusTone(
                          active.booking.status,
                        )}`}
                      >
                        {prettyStatus(active.booking.status)}
                      </span>
                    </div>

                    <div className="mt-3 grid gap-2 rounded-2xl border border-slate-300/80 bg-slate-100/70 p-3.5 font-mono text-xs text-slate-700 sm:grid-cols-2">
                      <div>
                        <span className="font-bold text-slate-500">
                          {tr("inbox.labels.service")}:
                        </span>{" "}
                        <span className="font-semibold text-slate-900">
                          {active.booking.serviceName}
                        </span>
                      </div>
                      <div>
                        <span className="font-bold text-slate-500">
                          {tr("inbox.labels.time")}:
                        </span>{" "}
                        <span className="font-semibold text-slate-900">
                          {formatDateTime(active.booking.startsAt)}
                        </span>
                      </div>
                      <div>
                        <span className="font-bold text-slate-500">
                          {tr("inbox.labels.price")}:
                        </span>{" "}
                        <span className="font-semibold text-slate-900">
                          {formatMoney(
                            active.booking.price,
                            active.booking.currency,
                            locale,
                          )}
                        </span>
                      </div>
                      {active.booking.customerEmail ? (
                        <div>
                          <span className="font-bold text-slate-500">
                            {tr("inbox.labels.email")}:
                          </span>{" "}
                          <span className="font-semibold text-slate-900">
                            {active.booking.customerEmail}
                          </span>
                        </div>
                      ) : null}
                      {active.booking.customerPhone ? (
                        <div>
                          <span className="font-bold text-slate-500">
                            {tr("inbox.labels.phone")}:
                          </span>{" "}
                          <span className="font-semibold text-slate-900">
                            {active.booking.customerPhone}
                          </span>
                        </div>
                      ) : null}
                      {active.booking.notes ? (
                        <div className="sm:col-span-2">
                          <span className="font-bold text-slate-500">
                            {tr("inbox.labels.notes")}:
                          </span>{" "}
                          <span className="italic text-slate-900">
                            {active.booking.notes}
                          </span>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>

              {error ? (
                <div className="mx-5 mt-4 rounded-2xl border border-rose-300/80 bg-rose-50/90 p-3.5 font-mono text-xs font-bold text-rose-800 shadow-2xs sm:mx-6">
                  ✕ {error}
                </div>
              ) : null}

              {/* Message Feed */}
              <div className="flex-1 space-y-3 overflow-y-auto bg-slate-100/50 p-5 sm:p-6">
                {active.messages.length === 0 ? (
                  <div className="flex h-full items-center justify-center font-mono text-xs text-slate-500">
                    {tr("inbox.noMessages")}
                  </div>
                ) : (
                  active.messages.map((m) => {
                    const isBusiness = m.senderType === "BUSINESS";
                    const isSystem = m.senderType === "SYSTEM";

                    return (
                      <div
                        key={m.id}
                        className={[
                          "max-w-[85%] rounded-2xl px-4 py-3 text-xs sm:text-sm shadow-2xs",
                          isSystem
                            ? "mx-auto border border-slate-300/80 bg-slate-200/90 text-slate-700 font-mono text-xs text-center"
                            : isBusiness
                              ? "ml-auto border border-lime-300/80 bg-lime-100 text-lime-950 font-medium"
                              : "border border-slate-300/80 bg-white/95 text-slate-900",
                        ].join(" ")}
                      >
                        <div className="whitespace-pre-wrap leading-relaxed">
                          {m.body}
                        </div>
                        <div
                          className={`mt-2 font-mono text-[10px] ${
                            isBusiness ? "text-lime-900/70" : "text-slate-400"
                          }`}
                        >
                          {formatDateTime(m.createdAt)}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Reply Box */}
              <div className="border-t border-slate-300/70 bg-white/80 p-4 sm:p-6 backdrop-blur-sm">
                {selectedSummary ? (
                  <div className="mb-2 font-mono text-[11px] text-slate-500">
                    {tr("inbox.replyingTo", {
                      customer: selectedSummary.customerName,
                      service: selectedSummary.serviceName,
                    })}
                  </div>
                ) : null}

                <div className="space-y-3">
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={tr("inbox.placeholder")}
                    className="min-h-[100px] w-full resize-y rounded-2xl border border-slate-300/80 bg-white/90 p-4 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:bg-white focus:outline-none sm:text-sm"
                  />

                  <div className="flex items-center justify-end">
                    <button
                      type="button"
                      onClick={sendMessage}
                      disabled={sending || !message.trim()}
                      className="inline-flex items-center justify-center rounded-2xl border border-lime-300/80 bg-lime-100 px-6 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-lime-950 shadow-xs transition hover:bg-lime-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {sending ? tr("inbox.sending") : tr("inbox.send")} →
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
