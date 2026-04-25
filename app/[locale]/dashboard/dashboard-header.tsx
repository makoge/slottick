"use client";

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
  onLogout
}: Props) {
  return (
    <div className="rounded-3xl border border-slate-200  p-6 shadow-sm bg-[#071633]">
  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
    <div className="flex items-start gap-4">
      <div className="h-14 w-14 overflow-hidden rounded-2xl border border-slate-900 bg-white shadow-sm">
        {biz.logoUrl ? (
          <img
            src={biz.logoUrl}
            alt={t(messages, "dashboard.header.logoAlt")}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-slate-100">
            {biz.name?.charAt(0)?.toUpperCase() || "S"}
          </div>
        )}
      </div>

      <div>
        <p className="text-sm font-medium text-slate-100">
          {t(messages, "dashboard.header.kicker")}
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight capitalize text-white">{biz.name}</h1>

        <p className="mt-1 text-sm text-slate-100">
          <span className="font-semibold text-slate-100 capitalize">
         {biz.industry ?? t(messages, "dashboard.header.industryFallback")}
          </span>
          {biz.city ? ` • ${biz.city}` : ""}
          
        </p>
      </div>
    </div>

    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={onEdit}
        className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-slate-200 hover:bg-lime-100"
      >
        {t(messages, "dashboard.actions.editProfile")}
      </button>

      <a
        className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-slate-200 hover:bg-lime-100"
        href={bookingPath}
        target="_blank"
        rel="noreferrer"
      >
        {t(messages, "dashboard.actions.openBookingPage")}
      </a>

      <button
        type="button"
        onClick={onRefresh}
        className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-slate-200 hover:bg-lime-100 disabled:opacity-60"
        disabled={statsLoading}
      >
        {statsLoading
          ? t(messages, "dashboard.actions.refreshing")
          : t(messages, "dashboard.actions.refreshStats")}
      </button>

      <button
        onClick={onLogout}
        className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-slate-200 hover:bg-lime-100"
        type="button"
      >
        {t(messages, "dashboard.actions.logout")}
      </button>
    </div>
  </div>
</div>
  );
}