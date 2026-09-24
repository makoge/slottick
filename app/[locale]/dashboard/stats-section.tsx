"use client";

import React from "react";
import { t } from "@/lib/i18n";

type StatCardProps = {
  title: string;
  badgeText?: string;
  value?: string;
  sub?: string;
  children?: React.ReactNode;
};

type Props = {
  messages: any;
  statsLoading: boolean;
  stats: {
    totalBookings: number;
    uniqueCustomers: number;
    weeklyRevenue: string;
    monthlyRevenue: string;
    yearlyRevenue: string;
  };
};

function StatCard({ title, badgeText, value, sub, children }: StatCardProps) {
  return (
    <div className="relative flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-400/40 bg-white/75 p-6 shadow-xl backdrop-blur-2xl transition-all hover:border-slate-400/60 hover:bg-white/85">
      <div>
        <div className="flex items-center justify-between gap-2 border-b border-slate-300/70 pb-3">
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-500">
            {title}
          </span>
          {badgeText && (
            <span className="inline-flex items-center gap-1 rounded-full border border-lime-300/80 bg-lime-100 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-lime-950">
              <span className="h-1.5 w-1.5 rounded-full bg-lime-700" />
              {badgeText}
            </span>
          )}
        </div>

        {value && (
          <div className="mt-4 font-mono text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            {value}
          </div>
        )}

        {children && <div className="mt-4 space-y-2.5">{children}</div>}
      </div>

      {sub && (
        <div className="mt-4 border-t border-slate-200/80 pt-3 font-mono text-[11px] text-slate-500">
          {sub}
        </div>
      )}
    </div>
  );
}

export default function StatsSection({ messages, statsLoading, stats }: Props) {
  return (
    <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {/* TOTAL BOOKINGS */}
      <StatCard
        title={t(messages, "dashboard.stats.totalBookings.title")}
        badgeText="Lifetime"
        value={statsLoading ? "—" : String(stats.totalBookings)}
        sub={
          statsLoading
            ? t(messages, "common.loading")
            : t(messages, "dashboard.stats.totalBookings.sub")
        }
      />

      {/* REVENUE BREAKDOWN */}
      <StatCard
        title={t(messages, "dashboard.stats.revenue.title")}
        badgeText="Gross Vol"
        sub={
          statsLoading
            ? t(messages, "common.loading")
            : t(messages, "dashboard.stats.revenue.sub")
        }
      >
        <div className="space-y-2 rounded-2xl border border-slate-300/80 bg-slate-100/70 p-3.5 backdrop-blur-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="rounded-md border border-lime-300/80 bg-lime-100 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-lime-950">
              {t(messages, "dashboard.stats.revenue.weekly")}
            </span>
            <span className="font-mono text-sm font-bold text-slate-900">
              {statsLoading ? "—" : stats.weeklyRevenue}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-slate-200/70 pt-2">
            <span className="rounded-md border border-lime-300/80 bg-lime-100 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-lime-950">
              {t(messages, "dashboard.stats.revenue.monthly")}
            </span>
            <span className="font-mono text-sm font-bold text-slate-900">
              {statsLoading ? "—" : stats.monthlyRevenue}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-slate-200/70 pt-2">
            <span className="rounded-md border border-lime-300/80 bg-lime-100 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-lime-950">
              {t(messages, "dashboard.stats.revenue.yearly")}
            </span>
            <span className="font-mono text-sm font-bold text-slate-900">
              {statsLoading ? "—" : stats.yearlyRevenue}
            </span>
          </div>
        </div>
      </StatCard>

      {/* UNIQUE CLIENTS */}
      <StatCard
        title={t(messages, "dashboard.stats.customers.title")}
        badgeText="Verified"
        value={statsLoading ? "—" : String(stats.uniqueCustomers)}
        sub={
          statsLoading
            ? t(messages, "common.loading")
            : t(messages, "dashboard.stats.customers.sub")
        }
      />
    </section>
  );
}
