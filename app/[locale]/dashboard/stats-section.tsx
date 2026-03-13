"use client";

import React from "react";
import { t } from "@/lib/i18n";

type StatCardProps = {
  title: string;
  value?: string;
  sub?: string;
  tone?: "blue" | "green" | "purple";
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

const tones = {
  blue: "bg-blue-50 border-blue-200",
  green: "bg-emerald-50 border-emerald-200",
  purple: "bg-purple-50 border-purple-200"
};

function StatCard({
  title,
  value,
  sub,
  tone = "blue",
  children
}: StatCardProps) {
  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${tones[tone]}`}>
      <div className="text-sm font-medium text-slate-600">{title}</div>
      {value && (
        <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
          {value}
        </div>
      )}
      {sub && <div className="mt-1 text-sm text-slate-500">{sub}</div>}
      {children && <div className="mt-3">{children}</div>}
    </div>
  );
}

export default function StatsSection({
  messages,
  statsLoading,
  stats
}: Props) {
  return (
    <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <StatCard
        title={t(messages, "dashboard.stats.totalBookings.title")}
        value={statsLoading ? "—" : String(stats.totalBookings)}
        sub={
          statsLoading
            ? t(messages, "common.loading")
            : t(messages, "dashboard.stats.totalBookings.sub")
        }
        tone="blue"
      />

      <StatCard
        title={t(messages, "dashboard.stats.revenue.title")}
        sub={
          statsLoading
            ? t(messages, "common.loading")
            : t(messages, "dashboard.stats.revenue.sub")
        }
        tone="green"
      >
        <div className="grid gap-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
              {t(messages, "dashboard.stats.revenue.weekly")}
            </span>
            <span className="font-semibold text-slate-900">
              {statsLoading ? "—" : stats.weeklyRevenue}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
              {t(messages, "dashboard.stats.revenue.monthly")}
            </span>
            <span className="font-semibold text-slate-900">
              {statsLoading ? "—" : stats.monthlyRevenue}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
              {t(messages, "dashboard.stats.revenue.yearly")}
            </span>
            <span className="font-semibold text-slate-900">
              {statsLoading ? "—" : stats.yearlyRevenue}
            </span>
          </div>
        </div>
      </StatCard>

      <StatCard
        title={t(messages, "dashboard.stats.customers.title")}
        value={statsLoading ? "—" : String(stats.uniqueCustomers)}
        sub={
          statsLoading
            ? t(messages, "common.loading")
            : t(messages, "dashboard.stats.customers.sub")
        }
        tone="purple"
      />
    </div>
  );
}