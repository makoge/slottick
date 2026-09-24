"use client";

import { useEffect, useState, useMemo } from "react";
import { useMessages } from "@/lib/use-messages";
import { t } from "@/lib/i18n";

type Props = {
  locale: string;
};

type StaffItem = {
  id: string;
  name: string;
  title: string | null;
  isActive: boolean;
  services: { id: string; name: string }[];
};

type AvailableService = {
  id: string;
  name: string;
};

export default function StaffPanel({ locale }: Props) {
  const messages = useMessages(locale);

  const [staffList, setStaffList] = useState<StaffItem[]>([]);
  const [availableServices, setAvailableServices] = useState<
    AvailableService[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [staffRes, servicesRes] = await Promise.all([
        fetch("/api/dashboard/staff"),
        fetch("/api/services"),
      ]);

      const staffData = await staffRes.json().catch(() => ({}));
      const servicesData = await servicesRes.json().catch(() => ({}));

      if (staffRes.ok)
        setStaffList(Array.isArray(staffData.staff) ? staffData.staff : []);
      if (servicesRes.ok)
        setAvailableServices(
          Array.isArray(servicesData.services) ? servicesData.services : [],
        );
    } catch {
      setError(t(messages, "dashboard.staff.errors.loadFailed"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleServiceSelection(id: string) {
    setSelectedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || creating) return;

    setCreating(true);
    setError(null);

    try {
      const res = await fetch("/api/dashboard/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          title: title.trim() || null,
          serviceIds: selectedServiceIds,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          data.error || t(messages, "dashboard.staff.errors.saveFailed"),
        );
      }

      setName("");
      setTitle("");
      setSelectedServiceIds([]);
      await loadData();
    } catch (err: any) {
      setError(err.message || t(messages, "dashboard.staff.errors.saveFailed"));
    } finally {
      setCreating(false);
    }
  }

  async function toggleActive(member: StaffItem) {
    setBusyId(member.id);
    setError(null);
    try {
      const res = await fetch(`/api/dashboard/staff/${member.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !member.isActive }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          data.error || t(messages, "dashboard.staff.errors.saveFailed"),
        );
      }

      setStaffList((prev) =>
        prev.map((m) =>
          m.id === member.id ? { ...m, isActive: !m.isActive } : m,
        ),
      );
    } catch (err: any) {
      setError(err.message || t(messages, "dashboard.staff.errors.saveFailed"));
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(t(messages, "common.remove") + "?")) return;

    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/dashboard/staff/${id}`, {
        method: "DELETE",
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          data.error || t(messages, "dashboard.staff.errors.deleteFailed"),
        );
      }

      setStaffList((prev) => prev.filter((m) => m.id !== id));
    } catch (err: any) {
      setError(
        err.message || t(messages, "dashboard.staff.errors.deleteFailed"),
      );
    } finally {
      setBusyId(null);
    }
  }

  const activeCount = useMemo(
    () => staffList.filter((m) => m.isActive).length,
    [staffList],
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-300/70 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-md border border-lime-300/80 bg-lime-100 font-mono text-[10px] font-bold text-lime-950">
              👥
            </span>
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-500">
              {t(messages, "dashboard.staff.title")}
            </h3>
          </div>
          <p className="mt-1 font-mono text-xs text-slate-600">
            {t(messages, "dashboard.staff.lead")}
          </p>
        </div>

        <span className="rounded-xl border border-slate-300/80 bg-white px-2.5 py-1 font-mono text-xs font-bold text-slate-800 shadow-2xs">
          {t(messages, "dashboard.staff.list.activeCount").replace(
            "{n}",
            String(activeCount),
          )}
        </span>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-300/80 bg-rose-50/90 p-3.5 font-mono text-xs font-bold text-rose-800 shadow-2xs">
          ✕ {error}
        </div>
      )}

      {/* Add Staff Form Drawer */}
      <form
        onSubmit={handleCreate}
        className="space-y-4 rounded-3xl border border-slate-300/80 bg-slate-100/70 p-5 backdrop-blur-sm"
      >
        <div className="font-mono text-xs font-bold uppercase tracking-wider text-slate-700">
          {t(messages, "dashboard.staff.actions.add")}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1.5">
            <span className="font-mono text-[11px] font-bold uppercase text-slate-600">
              {t(messages, "dashboard.staff.fields.name")}
            </span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t(
                messages,
                "dashboard.staff.fields.namePlaceholder",
              )}
              required
              className="h-11 w-full rounded-2xl border border-slate-300/80 bg-white/90 px-3.5 text-xs sm:text-sm font-medium text-slate-900 outline-none focus:border-slate-800 focus:bg-white"
            />
          </label>

          <label className="space-y-1.5">
            <span className="font-mono text-[11px] font-bold uppercase text-slate-600">
              {t(messages, "dashboard.staff.fields.title")}
            </span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t(
                messages,
                "dashboard.staff.fields.titlePlaceholder",
              )}
              className="h-11 w-full rounded-2xl border border-slate-300/80 bg-white/90 px-3.5 text-xs sm:text-sm font-medium text-slate-900 outline-none focus:border-slate-800 focus:bg-white"
            />
          </label>
        </div>

        {/* Multi-Select Assigned Services */}
        <div className="space-y-2 rounded-2xl border border-slate-300/80 bg-white/80 p-4">
          <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-slate-600">
            {t(messages, "dashboard.staff.fields.services")}
          </span>

          <div className="flex flex-wrap gap-2 pt-1">
            {availableServices.length === 0 ? (
              <span className="font-mono text-xs text-slate-400">
                {t(messages, "services.list.empty")}
              </span>
            ) : (
              availableServices.map((svc) => {
                const selected = selectedServiceIds.includes(svc.id);
                return (
                  <button
                    key={svc.id}
                    type="button"
                    onClick={() => toggleServiceSelection(svc.id)}
                    className={[
                      "rounded-xl border px-3 py-1.5 font-mono text-xs font-semibold transition-all active:scale-95",
                      selected
                        ? "border-lime-300/90 bg-lime-100 text-lime-950 shadow-2xs"
                        : "border-slate-300/80 bg-slate-50 text-slate-600 hover:bg-white",
                    ].join(" ")}
                  >
                    {selected ? "✓ " : "+ "}
                    {svc.name}
                  </button>
                );
              })
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={creating || !name.trim()}
          className="inline-flex items-center justify-center rounded-2xl border border-lime-300/80 bg-lime-100 px-6 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-lime-950 shadow-xs transition hover:bg-lime-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {creating
            ? t(messages, "dashboard.staff.states.saving")
            : `${t(messages, "dashboard.staff.actions.add")} →`}
        </button>
      </form>

      {/* Roster Grid */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center rounded-2xl border border-slate-300/80 bg-white/60 p-8 font-mono text-xs text-slate-500 animate-pulse">
            {t(messages, "dashboard.staff.states.loading")}
          </div>
        ) : staffList.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300/80 bg-slate-100/50 p-6 text-center font-mono text-xs text-slate-500">
            {t(messages, "dashboard.staff.list.empty")}
          </div>
        ) : (
          staffList.map((m) => {
            const isBusy = busyId === m.id;
            return (
              <div
                key={m.id}
                className="flex flex-col gap-3 rounded-2xl border border-slate-300/80 bg-white/80 p-4 shadow-2xs backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{m.name}</span>
                    {m.title && (
                      <span className="rounded-md border border-slate-300/80 bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-700">
                        {m.title}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1 pt-1">
                    {m.services.length === 0 ? (
                      <span className="font-mono text-[11px] text-slate-400 italic">
                        {t(messages, "dashboard.staff.fields.services")}: None
                      </span>
                    ) : (
                      m.services.map((s) => (
                        <span
                          key={s.id}
                          className="rounded-md border border-lime-300/80 bg-lime-100 px-1.5 py-0.5 font-mono text-[10px] font-medium text-lime-950"
                        >
                          {s.name}
                        </span>
                      ))
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => toggleActive(m)}
                    className={[
                      "rounded-full px-2.5 py-1 font-mono text-[10px] font-bold border transition",
                      m.isActive
                        ? "bg-emerald-500/10 text-emerald-700 border-emerald-300/50 hover:bg-emerald-500/20"
                        : "bg-slate-200/60 text-slate-600 border-slate-300 hover:bg-slate-200",
                    ].join(" ")}
                  >
                    {m.isActive
                      ? t(messages, "dashboard.staff.actions.setActive")
                      : t(messages, "dashboard.staff.actions.setInactive")}
                  </button>

                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => handleDelete(m.id)}
                    className="rounded-xl border border-rose-300/80 bg-rose-50 px-2.5 py-1 font-mono text-[10px] font-bold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
                  >
                    {t(messages, "dashboard.staff.actions.delete")}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
