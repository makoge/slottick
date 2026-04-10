"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale } from "@/lib/use-locale";
import { useMessages } from "@/lib/use-messages";
import { t } from "@/lib/i18n";

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
      return "bg-amber-100 text-amber-800 ring-amber-200";
    case "NEEDS_INFO":
      return "bg-blue-100 text-blue-800 ring-blue-200";
    case "CONFIRMED":
      return "bg-emerald-100 text-emerald-800 ring-emerald-200";
    case "DECLINED":
    case "CANCELLED":
      return "bg-red-100 text-red-800 ring-red-200";
    case "DONE":
      return "bg-slate-100 text-slate-700 ring-slate-200";
    default:
      return "bg-slate-100 text-slate-700 ring-slate-200";
  }
}

function formatMoney(amount: number, currency: string, locale: string) {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency
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
      minute: "2-digit"
    }).format(d);
  }

  function prettyStatus(status: string) {
    const key = status.toLowerCase();
    return tr(`inbox.status.${key}`);
  }

  const [items, setItems] = useState<ConversationListItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [active, setActive] = useState<ActiveConversation | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sending, setSending] = useState(false);
  const [acting, setActing] = useState<"" | "accept" | "decline">("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function loadList(keepSelection = true) {
    try {
      if (!keepSelection) setLoadingList(true);

      const res = await fetch("/api/dashboard/conversations", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error || tr("inbox.errors.loadInbox"));
      }

      const nextItems: ConversationListItem[] = Array.isArray(data?.conversations)
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
        { cache: "no-store" }
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
          body: JSON.stringify({ body: message.trim() })
        }
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

  async function respond(action: "accept" | "decline") {
    if (!active?.booking?.id || acting) return;

    try {
      setActing(action);
      setError(null);

      const res = await fetch(
        `/api/dashboard/bookings/${encodeURIComponent(active.booking.id)}/respond`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action })
        }
      );

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          data?.error ||
            (action === "accept"
              ? tr("inbox.errors.acceptBooking")
              : tr("inbox.errors.declineBooking"))
        );
      }

      await Promise.all([loadThread(activeId), loadList()]);
    } catch (err: any) {
      setError(
        err?.message ||
          (action === "accept"
            ? tr("inbox.errors.acceptBooking")
            : tr("inbox.errors.declineBooking"))
      );
    } finally {
      setActing("");
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
    [items, activeId]
  );

  return (
    <section className="grid gap-6 lg:grid-cols-12">
      <div className="lg:col-span-4">
        <div className="overflow-hidden rounded-[28px] bg-white shadow-[0_25px_70px_-35px_rgba(15,23,42,0.25)] ring-1 ring-slate-200">
          <div className="border-b border-slate-200 px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {tr("inbox.title")}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {tr("inbox.subtitle")}
                </p>
              </div>

              <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
                {items.length}
              </span>
            </div>
          </div>

          <div className="max-h-[72vh] overflow-y-auto">
            {loadingList ? (
              <div className="p-5 text-sm text-slate-500">{tr("inbox.loading")}</div>
            ) : items.length === 0 ? (
              <div className="p-5 text-sm text-slate-500">{tr("inbox.empty")}</div>
            ) : (
              <div className="divide-y divide-slate-100">
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
                        "w-full px-5 py-4 text-left transition",
                        activeRow ? "bg-slate-50" : "hover:bg-slate-50/70"
                      ].join(" ")}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate font-semibold text-slate-900">
                            {item.customerName}
                          </div>
                          <div className="mt-1 truncate text-sm text-slate-600">
                            {item.serviceName}
                          </div>
                        </div>

                        <div className="flex shrink-0 flex-col items-end gap-2">
                          <span
                            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${statusTone(
                              item.bookingStatus
                            )}`}
                          >
                            {prettyStatus(item.bookingStatus)}
                          </span>

                          {item.unreadCount > 0 ? (
                            <span className="rounded-full bg-fuchsia-600 px-2 py-0.5 text-[11px] font-semibold text-white">
                              {item.unreadCount}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-3">
                        <div className="min-w-0 truncate text-sm text-slate-500">
                          {item.lastMessage?.body || tr("inbox.noMessages")}
                        </div>
                        <div className="shrink-0 text-xs text-slate-400">
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

      <div className="lg:col-span-8">
        <div className="flex min-h-[72vh] flex-col overflow-hidden rounded-[28px] bg-white shadow-[0_25px_70px_-35px_rgba(15,23,42,0.25)] ring-1 ring-slate-200">
          {!activeId ? (
            <div className="flex flex-1 items-center justify-center p-8 text-center text-slate-500">
              {tr("inbox.selectConversation")}
            </div>
          ) : loadingThread && !active ? (
            <div className="flex flex-1 items-center justify-center p-8 text-slate-500">
              {tr("inbox.loadingConversation")}
            </div>
          ) : !active ? (
            <div className="flex flex-1 items-center justify-center p-8 text-slate-500">
              {tr("inbox.conversationNotFound")}
            </div>
          ) : (
            <>
              <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-xl font-semibold text-slate-900">
                        {active.booking.customerName}
                      </h3>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${statusTone(
                          active.booking.status
                        )}`}
                      >
                        {prettyStatus(active.booking.status)}
                      </span>
                    </div>

                    <div className="mt-2 grid gap-1 text-sm text-slate-600">
                      <div>
                        <span className="font-medium text-slate-900">
                          {tr("inbox.labels.service")}:
                        </span>{" "}
                        {active.booking.serviceName}
                      </div>
                      <div>
                        <span className="font-medium text-slate-900">
                          {tr("inbox.labels.time")}:
                        </span>{" "}
                        {formatDateTime(active.booking.startsAt)}
                      </div>
                      <div>
                        <span className="font-medium text-slate-900">
                          {tr("inbox.labels.price")}:
                        </span>{" "}
                        {formatMoney(active.booking.price, active.booking.currency, locale)}
                      </div>
                      {active.booking.customerEmail ? (
                        <div>
                          <span className="font-medium text-slate-900">
                            {tr("inbox.labels.email")}:
                          </span>{" "}
                          {active.booking.customerEmail}
                        </div>
                      ) : null}
                      {active.booking.customerPhone ? (
                        <div>
                          <span className="font-medium text-slate-900">
                            {tr("inbox.labels.phone")}:
                          </span>{" "}
                          {active.booking.customerPhone}
                        </div>
                      ) : null}
                      {active.booking.notes ? (
                        <div>
                          <span className="font-medium text-slate-900">
                            {tr("inbox.labels.notes")}:
                          </span>{" "}
                          {active.booking.notes}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => respond("accept")}
                      disabled={acting !== "" || active.booking.status === "CONFIRMED"}
                      className="rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
                    >
                      {acting === "accept"
                        ? tr("inbox.accepting")
                        : tr("inbox.accept")}
                    </button>

                    <button
                      type="button"
                      onClick={() => respond("decline")}
                      disabled={acting !== "" || active.booking.status === "DECLINED"}
                      className="rounded-2xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-700 disabled:opacity-60"
                    >
                      {acting === "decline"
                        ? tr("inbox.declining")
                        : tr("inbox.decline")}
                    </button>
                  </div>
                </div>
              </div>

              {error ? (
                <div className="mx-5 mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-100 sm:mx-6">
                  {error}
                </div>
              ) : null}

              <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50/70 px-5 py-5 sm:px-6">
                {active.messages.length === 0 ? (
                  <div className="text-sm text-slate-500">{tr("inbox.noMessages")}</div>
                ) : (
                  active.messages.map((m) => {
                    const isBusiness = m.senderType === "BUSINESS";
                    const isSystem = m.senderType === "SYSTEM";

                    return (
                      <div
                        key={m.id}
                        className={[
                          "max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm",
                          isSystem
                            ? "mx-auto bg-slate-200 text-slate-700"
                            : isBusiness
                            ? "ml-auto bg-slate-900 text-white"
                            : "bg-white text-slate-900 ring-1 ring-slate-200"
                        ].join(" ")}
                      >
                        <div className="whitespace-pre-wrap">{m.body}</div>
                        <div
                          className={`mt-2 text-xs ${
                            isBusiness ? "text-white/70" : "text-slate-400"
                          }`}
                        >
                          {formatDateTime(m.createdAt)}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="border-t border-slate-200 bg-white px-5 py-4 sm:px-6">
                {selectedSummary ? (
                  <div className="mb-3 text-xs text-slate-400">
                    {tr("inbox.replyingTo", {
                      customer: selectedSummary.customerName,
                      service: selectedSummary.serviceName
                    })}
                  </div>
                ) : null}

                <div className="grid gap-3">
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={tr("inbox.placeholder")}
                    className="min-h-[110px] rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />

                  <div className="flex items-center justify-end">
                    <button
                      type="button"
                      onClick={sendMessage}
                      disabled={sending || !message.trim()}
                      className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-60"
                    >
                      {sending ? tr("inbox.sending") : tr("inbox.send")}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}