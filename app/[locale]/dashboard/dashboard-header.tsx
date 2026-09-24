"use client";

import Link from "next/link";
import { t } from "@/lib/i18n";

type Props = {
  biz: any;
  messages: any;
  bookingPath: string;
  statsLoading: boolean;
  onEdit: () => void;
  onRefresh: () => void;
  onLogout: () => void;
};

export default function DashboardHeader({
  biz,
  messages,
  bookingPath,
  statsLoading,
  onEdit,
  onRefresh,
  onLogout,
}: Props) {
  return (
    <header className="rounded-3xl border border-slate-400/40 bg-white/75 p-6 shadow-xl backdrop-blur-2xl sm:p-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        {/* Brand Identity & Metadata */}
        <div className="flex items-start gap-4">
          <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-300/80 bg-white/90 shadow-2xs">
            {biz.logoUrl ? (
              <img
                src={biz.logoUrl}
                alt={t(messages, "dashboard.header.logoAlt")}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="font-mono text-xl font-extrabold uppercase text-slate-900">
                {biz.name?.charAt(0)?.toUpperCase() || "S"}
              </span>
            )}
          </div>

          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-lime-300/80 bg-lime-100 px-3 py-0.5 text-xs font-bold text-lime-950 shadow-2xs">
              <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-lime-900 text-[9px] text-white">
                ✓
              </span>
              <span className="font-mono text-[10px] uppercase tracking-wider">
                {t(messages, "dashboard.header.kicker")}
              </span>
            </div>

            <h1 className="mt-2 truncate text-2xl font-extrabold tracking-tight capitalize text-slate-900 sm:text-3xl">
              {biz.name}
            </h1>

            <div className="mt-1 flex flex-wrap items-center gap-2 font-mono text-xs text-slate-600">
              <span className="font-bold capitalize text-slate-800">
                {biz.industry ??
                  t(messages, "dashboard.header.industryFallback")}
              </span>
              {biz.city ? <span>• {biz.city}</span> : null}
              {biz.country ? <span>• {biz.country}</span> : null}
            </div>
          </div>
        </div>

        {/* Global Dashboard Control Actions */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          <button
            type="button"
            onClick={onEdit}
            className="rounded-2xl border border-slate-300/80 bg-white/80 px-4 py-2.5 font-mono text-xs font-semibold text-slate-700 shadow-2xs backdrop-blur-sm transition-all hover:border-slate-400 hover:bg-white hover:text-slate-950 active:scale-95"
          >
            {t(messages, "dashboard.actions.editProfile")}
          </button>

          <Link
            href={bookingPath}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-2xl border border-lime-300/80 bg-lime-100 px-4 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-lime-950 shadow-xs transition hover:bg-lime-200 active:scale-95"
          >
            <span>{t(messages, "dashboard.actions.openBookingPage")}</span>
            <span aria-hidden="true">↗</span>
          </Link>

          <button
            type="button"
            onClick={onRefresh}
            disabled={statsLoading}
            className="rounded-2xl border border-slate-300/80 bg-white/80 px-4 py-2.5 font-mono text-xs font-semibold text-slate-700 shadow-2xs backdrop-blur-sm transition-all hover:border-slate-400 hover:bg-white hover:text-slate-950 active:scale-95 disabled:opacity-50"
          >
            {statsLoading
              ? t(messages, "dashboard.actions.refreshing")
              : t(messages, "dashboard.actions.refreshStats")}
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="rounded-2xl border border-rose-300/70 bg-rose-50/70 px-4 py-2.5 font-mono text-xs font-semibold text-rose-700 shadow-2xs transition hover:bg-rose-100 active:scale-95"
          >
            {t(messages, "dashboard.actions.logout")}
          </button>
        </div>
      </div>
    </header>
  );
}
