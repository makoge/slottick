"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useMessages } from "@/lib/use-messages";
import { t } from "@/lib/i18n";

type ClientSummary = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  allergies: string | null;
  recordsCount: number;
  lastVisit?: string | null;
  lastFormula?: string | null;
};

export default function PatronsPanel({ locale }: { locale: string }) {
  const messages = useMessages(locale);
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [err, setErr] = useState("");

  async function load() {
    setErr("");
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard/clients", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          data?.error ||
            t(messages, "dashboard.dossierPanel.errors.loadFailed"),
        );
      }
      setClients(Array.isArray(data.clients) ? data.clients : []);
    } catch (e: any) {
      setErr(
        e?.message || t(messages, "dashboard.dossierPanel.errors.loadFailed"),
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = clients.filter((c) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      (c.phone && c.phone.includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q))
    );
  });

  return (
    <section className="mt-8 rounded-3xl border border-slate-400/40 bg-white/75 p-6 shadow-xl backdrop-blur-2xl sm:p-8">
      <div className="flex flex-col gap-4 border-b border-slate-300/70 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-md border border-lime-300/80 bg-lime-100 font-mono text-[10px] font-bold text-lime-950">
              ✦
            </span>
            <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-500">
              {t(messages, "dashboard.dossierPanel.title")}
            </h2>
          </div>
          <p className="mt-1 text-sm font-bold text-slate-900">
            {t(messages, "dashboard.dossierPanel.lead")}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="search"
            placeholder={t(
              messages,
              "dashboard.dossierPanel.searchPlaceholder",
            )}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-10 rounded-2xl border border-slate-300/80 bg-white/90 px-4 font-mono text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:outline-none"
          />
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="rounded-2xl border border-slate-300/80 bg-white/80 px-4 py-2.5 font-mono text-xs font-semibold text-slate-700 shadow-2xs backdrop-blur-sm transition hover:bg-white active:scale-95 disabled:opacity-50"
          >
            {t(messages, "dashboard.dossierPanel.refresh")}
          </button>
        </div>
      </div>

      {err && (
        <div className="mt-4 rounded-2xl border border-rose-300/80 bg-rose-50/90 p-3.5 font-mono text-xs font-bold text-rose-800 shadow-2xs">
          ✕ {err}
        </div>
      )}

      {loading ? (
        <div className="mt-6 rounded-2xl border border-slate-300/80 bg-white/60 p-8 text-center font-mono text-xs text-slate-500 animate-pulse">
          {t(messages, "dashboard.dossierPanel.states.loading")}
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300/80 bg-slate-100/50 p-8 text-center font-mono text-xs text-slate-500">
          {query
            ? t(messages, "dashboard.dossierPanel.states.noResults")
            : t(messages, "dashboard.dossierPanel.states.empty")}
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((client) => {
            const visitCountText =
              client.recordsCount === 1
                ? t(
                    messages,
                    "dashboard.dossierPanel.card.visitsLogged",
                  ).replace("{n}", String(client.recordsCount))
                : t(
                    messages,
                    "dashboard.dossierPanel.card.visitsLoggedPlural",
                  ).replace("{n}", String(client.recordsCount));

            return (
              <div
                key={client.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-300/80 bg-white/80 p-5 shadow-2xs transition hover:border-slate-400"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-serif text-lg font-bold text-slate-900">
                      {client.name}
                    </h3>
                    {client.allergies && (
                      <span className="rounded-md border border-rose-300 bg-rose-50 px-2 py-0.5 font-mono text-[10px] font-bold text-rose-800">
                        {t(
                          messages,
                          "dashboard.dossierPanel.card.allergyBadge",
                        )}
                      </span>
                    )}
                  </div>

                  <div className="mt-2 space-y-1 font-mono text-xs text-slate-600">
                    {client.phone && <div>📞 {client.phone}</div>}
                    {client.email && <div>✉️ {client.email}</div>}
                  </div>

                  {client.allergies && (
                    <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50/70 p-2.5 font-mono text-[11px] text-rose-900">
                      <strong>
                        {t(
                          messages,
                          "dashboard.dossierPanel.card.notePrefix",
                        )}{" "}
                      </strong>
                      {client.allergies}
                    </p>
                  )}

                  {client.lastFormula && (
                    <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-2.5 font-mono text-[11px] text-slate-700">
                      <span className="font-bold text-slate-900">
                        {t(
                          messages,
                          "dashboard.dossierPanel.card.lastFormulaPrefix",
                        )}{" "}
                      </span>
                      {client.lastFormula}
                    </div>
                  )}
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-slate-200/80 pt-3">
                  <span className="font-mono text-[11px] text-slate-500">
                    {visitCountText}
                  </span>

                  <Link
                    href={`/${locale}/dashboard/clients/${client.id}`}
                    className="rounded-xl border border-lime-300/80 bg-lime-100 px-3.5 py-1.5 font-mono text-xs font-bold uppercase tracking-wider text-lime-950 transition hover:bg-lime-200 active:scale-95"
                  >
                    {t(messages, "dashboard.dossierPanel.card.viewDossier")}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
