"use client";

import { useEffect, useMemo, useState } from "react";
import { t } from "@/lib/i18n";

type Client = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  birthday?: string; // YYYY-MM-DD
  lastVisit?: string; // YYYY-MM-DD
};

type TriggerType = "birthday" | "appointmentReminder" | "winback" | "customDate";

type Automation = {
  id: string;
  name: string;
  trigger: {
    type: TriggerType;
    // appointmentReminder
    hoursBefore?: number;
    // winback
    daysSinceLastVisit?: number;
    // customDate
    sendAt?: string; // ISO
  };
  template: {
    subject: string;
    body: string;
  };
  audience: {
    mode: "all" | "segment";
    segment?: "hasBirthday" | "inactive30" | "inactive60";
  };
  createdAt: string;
};

const uid = () => Math.random().toString(36).slice(2, 10);

function isEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function clampInt(n: unknown, min: number, max: number, fallback: number) {
  const x = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(x)) return fallback;
  return Math.max(min, Math.min(max, Math.trunc(x)));
}

function isoNowPlusMinutes(minutes: number) {
  return new Date(Date.now() + minutes * 60_000).toISOString().slice(0, 16);
}

function formatDate(isoOrYmd?: string) {
  if (!isoOrYmd) return "—";
  // supports "YYYY-MM-DD" or ISO
  const d = new Date(isoOrYmd.length === 10 ? `${isoOrYmd}T00:00:00` : isoOrYmd);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
}

function renderTemplate(body: string, c?: Client) {
  const first = c?.name?.trim()?.split(/\s+/)?.[0] ?? "";
  const map: Record<string, string> = {
    "{name}": c?.name ?? "",
    "{firstName}": first,
    "{email}": c?.email ?? "",
  };
  let out = body;
  for (const k of Object.keys(map)) out = out.split(k).join(map[k]);
  return out;
}

const LS_CLIENTS = "slottick_cfu_clients_v1";
const LS_AUTOS = "slottick_cfu_autos_v1";

export default function ClientFollowUpAutomation({
  locale,
  messages,
}: {
  locale: string;
  messages: any;
}) {
  // --- Clients
  const [clients, setClients] = useState<Client[]>([]);
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [csvOpen, setCsvOpen] = useState(false);

  // --- Builder state
  const [autoName, setAutoName] = useState<string>("");
  const [triggerType, setTriggerType] = useState<TriggerType>("birthday");
  const [hoursBefore, setHoursBefore] = useState<number>(24);
  const [daysSinceLast, setDaysSinceLast] = useState<number>(30);
  const [customSendAt, setCustomSendAt] = useState<string>(() => isoNowPlusMinutes(60));

  const [audienceMode, setAudienceMode] = useState<"all" | "segment">("all");
  const [segment, setSegment] = useState<"hasBirthday" | "inactive30" | "inactive60">("hasBirthday");

  const [subject, setSubject] = useState<string>("");
  const [body, setBody] = useState<string>("");

  const [selectedClientId, setSelectedClientId] = useState<string>("");

  // --- Autos
  const [autos, setAutos] = useState<Automation[]>([]);

  // --- Toast
  const [toast, setToast] = useState<{ kind: "ok" | "bad"; msg: string } | null>(null);
  const toastShow = (kind: "ok" | "bad", msg: string) => {
    setToast({ kind, msg });
    window.setTimeout(() => setToast(null), 2800);
  };

  useEffect(() => {
    try {
      const c = JSON.parse(localStorage.getItem(LS_CLIENTS) ?? "[]");
      if (Array.isArray(c)) setClients(c);
    } catch {}
    try {
      const a = JSON.parse(localStorage.getItem(LS_AUTOS) ?? "[]");
      if (Array.isArray(a)) setAutos(a);
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(LS_CLIENTS, JSON.stringify(clients));
    } catch {}
  }, [clients]);

  useEffect(() => {
    try {
      localStorage.setItem(LS_AUTOS, JSON.stringify(autos));
    } catch {}
  }, [autos]);

  // Defaults for template per trigger (nice UX)
  useEffect(() => {
    // Only auto-fill when empty (don’t overwrite user edits)
    if (subject.trim() || body.trim()) return;

    if (triggerType === "birthday") {
      setSubject(t(messages, "clientFollowUpAutomation.ui.templates.birthday.subject"));
      setBody(t(messages, "clientFollowUpAutomation.ui.templates.birthday.body"));
      setAutoName(t(messages, "clientFollowUpAutomation.ui.templates.birthday.name"));
    } else if (triggerType === "appointmentReminder") {
      setSubject(t(messages, "clientFollowUpAutomation.ui.templates.reminder.subject"));
      setBody(t(messages, "clientFollowUpAutomation.ui.templates.reminder.body"));
      setAutoName(t(messages, "clientFollowUpAutomation.ui.templates.reminder.name"));
    } else if (triggerType === "winback") {
      setSubject(t(messages, "clientFollowUpAutomation.ui.templates.winback.subject"));
      setBody(t(messages, "clientFollowUpAutomation.ui.templates.winback.body"));
      setAutoName(t(messages, "clientFollowUpAutomation.ui.templates.winback.name"));
    } else {
      setSubject(t(messages, "clientFollowUpAutomation.ui.templates.custom.subject"));
      setBody(t(messages, "clientFollowUpAutomation.ui.templates.custom.body"));
      setAutoName(t(messages, "clientFollowUpAutomation.ui.templates.custom.name"));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerType]);

  const selectedClient = useMemo(
    () => clients.find((c) => c.id === selectedClientId) ?? clients[0],
    [clients, selectedClientId]
  );

  const variableChips = useMemo(
    () => [
      { k: "{firstName}", label: t(messages, "clientFollowUpAutomation.ui.vars.firstName") },
      { k: "{name}", label: t(messages, "clientFollowUpAutomation.ui.vars.name") },
      { k: "{email}", label: t(messages, "clientFollowUpAutomation.ui.vars.email") },
    ],
    [messages]
  );

  const audienceLabel = useMemo(() => {
    if (audienceMode === "all") return t(messages, "clientFollowUpAutomation.ui.audience.all");
    if (segment === "hasBirthday") return t(messages, "clientFollowUpAutomation.ui.audience.hasBirthday");
    if (segment === "inactive60") return t(messages, "clientFollowUpAutomation.ui.audience.inactive60");
    return t(messages, "clientFollowUpAutomation.ui.audience.inactive30");
  }, [audienceMode, segment, messages]);

  const triggerLabel = useMemo(() => {
    if (triggerType === "birthday") return t(messages, "clientFollowUpAutomation.ui.triggers.birthday");
    if (triggerType === "appointmentReminder") return t(messages, "clientFollowUpAutomation.ui.triggers.reminder");
    if (triggerType === "winback") return t(messages, "clientFollowUpAutomation.ui.triggers.winback");
    return t(messages, "clientFollowUpAutomation.ui.triggers.customDate");
  }, [triggerType, messages]);

  function addClient(c: Omit<Client, "id">) {
    const name = c.name.trim();
    const email = c.email.trim();
    if (!name || !email) return toastShow("bad", t(messages, "clientFollowUpAutomation.ui.toast.clientMissing"));
    if (!isEmail(email)) return toastShow("bad", t(messages, "clientFollowUpAutomation.ui.toast.clientEmailBad"));
    if (clients.some((x) => x.email.toLowerCase() === email.toLowerCase())) {
      return toastShow("bad", t(messages, "clientFollowUpAutomation.ui.toast.clientDuplicate"));
    }
    const next: Client = { id: uid(), ...c, name, email };
    setClients((p) => [next, ...p]);
    setSelectedClientId(next.id);
    toastShow("ok", t(messages, "clientFollowUpAutomation.ui.toast.clientAdded"));
  }

  function removeClient(id: string) {
    setClients((p) => p.filter((x) => x.id !== id));
    if (selectedClientId === id) setSelectedClientId("");
  }

  function insertVar(v: string) {
    setBody((p) => (p ? `${p}${p.endsWith(" ") ? "" : " "}${v}` : v));
  }

  function createAutomation() {
    const name = autoName.trim();
    if (!name) return toastShow("bad", t(messages, "clientFollowUpAutomation.ui.toast.autoNameMissing"));
    if (!subject.trim() || !body.trim()) {
      return toastShow("bad", t(messages, "clientFollowUpAutomation.ui.toast.templateMissing"));
    }

    const a: Automation = {
      id: uid(),
      name,
      trigger:
        triggerType === "birthday"
          ? { type: "birthday" }
          : triggerType === "appointmentReminder"
          ? { type: "appointmentReminder", hoursBefore: clampInt(hoursBefore, 1, 168, 24) }
          : triggerType === "winback"
          ? { type: "winback", daysSinceLastVisit: clampInt(daysSinceLast, 7, 365, 30) }
          : { type: "customDate", sendAt: new Date(customSendAt).toISOString() },
      template: { subject: subject.trim(), body: body.trim() },
      audience: audienceMode === "all" ? { mode: "all" } : { mode: "segment", segment },
      createdAt: new Date().toISOString(),
    };

    setAutos((p) => [a, ...p]);
    toastShow("ok", t(messages, "clientFollowUpAutomation.ui.toast.autoCreated"));
  }

  function deleteAutomation(id: string) {
    setAutos((p) => p.filter((x) => x.id !== id));
    toastShow("ok", t(messages, "clientFollowUpAutomation.ui.toast.autoDeleted"));
  }

  function resetTemplate() {
    setSubject("");
    setBody("");
    setAutoName("");
    toastShow("ok", t(messages, "clientFollowUpAutomation.ui.toast.templateReset"));
  }

  function exportAutos() {
    try {
      const payload = JSON.stringify({ clients, automations: autos }, null, 2);
      navigator.clipboard.writeText(payload);
      toastShow("ok", t(messages, "clientFollowUpAutomation.ui.toast.exportCopied"));
    } catch {
      toastShow("bad", t(messages, "clientFollowUpAutomation.ui.toast.exportFailed"));
    }
  }

  function importCsv(text: string) {
    // CSV columns supported:
    // name,email,birthday,lastVisit
    const lines = text
      .split(/\r?\n/)
      .map((x) => x.trim())
      .filter(Boolean);

    if (!lines.length) return toastShow("bad", t(messages, "clientFollowUpAutomation.ui.toast.csvEmpty"));

    const header = lines[0].toLowerCase();
    const start = header.includes("email") ? 1 : 0;

    let added = 0;

    for (let i = start; i < lines.length; i++) {
      const parts = lines[i].split(",").map((x) => x.trim());
      const [name, email, phone, birthday, lastVisit] = parts;
      if (!name || !email || !isEmail(email)) continue;

      if (clients.some((x) => x.email.toLowerCase() === email.toLowerCase())) continue;

      setClients((p) => [
        { id: uid(), name, email, phone: phone || undefined, birthday: birthday || undefined, lastVisit: lastVisit || undefined },
        ...p,
      ]);
      added++;
    }

    if (added) toastShow("ok", t(messages, "clientFollowUpAutomation.ui.toast.csvImported").replace("{n}", String(added)));
    else toastShow("bad", t(messages, "clientFollowUpAutomation.ui.toast.csvNone"));
  }

  const previewSubject = useMemo(() => renderTemplate(subject, selectedClient), [subject, selectedClient]);
  const previewBody = useMemo(() => renderTemplate(body, selectedClient), [body, selectedClient]);

  return (
    <div className="grid gap-8 lg:grid-cols-12">
      {/* Left: Clients + Saved */}
      <aside className="lg:col-span-4">
        <div className="rounded-[28px] bg-white p-5 ring-1 ring-slate-100">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                {t(messages, "clientFollowUpAutomation.ui.clients.title")}
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                {t(messages, "clientFollowUpAutomation.ui.clients.subtitle")}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCsvOpen(true)}
                className="rounded-2xl bg-white px-3 py-2 text-xs font-semibold text-slate-900 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
              >
                {t(messages, "clientFollowUpAutomation.ui.clients.importCsv")}
              </button>
              <button
                type="button"
                onClick={() => setClientModalOpen(true)}
                className="rounded-2xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-800"
              >
                {t(messages, "clientFollowUpAutomation.ui.clients.add")}
              </button>
            </div>
          </div>

          <div className="mt-4">
            {clients.length === 0 ? (
              <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600 ring-1 ring-slate-100">
                <p className="font-semibold text-slate-900">
                  {t(messages, "clientFollowUpAutomation.ui.clients.emptyTitle")}
                </p>
                <p className="mt-1">{t(messages, "clientFollowUpAutomation.ui.clients.emptyBody")}</p>
              </div>
            ) : (
              <div className="max-h-[360px] space-y-2 overflow-auto pr-1">
                {clients.map((c) => {
                  const active = (selectedClientId || clients[0]?.id) === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedClientId(c.id)}
                      className={[
                        "w-full rounded-2xl p-3 text-left ring-1 transition",
                        active
                          ? "bg-slate-900 text-white ring-slate-900"
                          : "bg-white text-slate-900 ring-slate-100 hover:bg-slate-50",
                      ].join(" ")}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold">{c.name}</p>
                          <p className={["mt-0.5 text-xs", active ? "text-white/80" : "text-slate-600"].join(" ")}>
                            {c.email}
                          </p>
                          <div className={["mt-2 flex flex-wrap gap-2 text-[11px]", active ? "text-white/80" : "text-slate-600"].join(" ")}>
                            <span className={["rounded-xl px-2 py-1", active ? "bg-white/10" : "bg-slate-100"].join(" ")}>
                              {t(messages, "clientFollowUpAutomation.ui.clients.birthday")}: {formatDate(c.birthday)}
                            </span>
                            <span className={["rounded-xl px-2 py-1", active ? "bg-white/10" : "bg-slate-100"].join(" ")}>
                              {t(messages, "clientFollowUpAutomation.ui.clients.lastVisit")}: {formatDate(c.lastVisit)}
                            </span>
                          </div>
                        </div>

                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            removeClient(c.id);
                          }}
                          className={["cursor-pointer rounded-xl px-2 py-1 text-xs font-semibold", active ? "bg-white/10" : "bg-slate-100 hover:bg-slate-200"].join(" ")}
                          title={t(messages, "common.remove")}
                          role="button"
                        >
                          {t(messages, "common.remove")}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 rounded-[28px] bg-white p-5 ring-1 ring-slate-100">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                {t(messages, "clientFollowUpAutomation.ui.saved.title")}
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                {t(messages, "clientFollowUpAutomation.ui.saved.subtitle")}
              </p>
            </div>
            <button
              type="button"
              onClick={exportAutos}
              className="rounded-2xl bg-white px-3 py-2 text-xs font-semibold text-slate-900 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
            >
              {t(messages, "clientFollowUpAutomation.ui.saved.export")}
            </button>
          </div>

          <div className="mt-4 space-y-2">
            {autos.length === 0 ? (
              <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600 ring-1 ring-slate-100">
                {t(messages, "clientFollowUpAutomation.ui.saved.empty")}
              </div>
            ) : (
              autos.slice(0, 5).map((a) => (
                <div key={a.id} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{a.name}</p>
                      <p className="mt-1 text-xs text-slate-600">
                        {t(messages, "clientFollowUpAutomation.ui.saved.trigger")}:{" "}
                        <span className="font-semibold text-slate-900">
                          {a.trigger.type === "birthday"
                            ? t(messages, "clientFollowUpAutomation.ui.triggers.birthday")
                            : a.trigger.type === "appointmentReminder"
                            ? t(messages, "clientFollowUpAutomation.ui.triggers.reminder")
                            : a.trigger.type === "winback"
                            ? t(messages, "clientFollowUpAutomation.ui.triggers.winback")
                            : t(messages, "clientFollowUpAutomation.ui.triggers.customDate")}
                        </span>{" "}
                        • {t(messages, "clientFollowUpAutomation.ui.saved.audience")}:{" "}
                        <span className="font-semibold text-slate-900">
                          {a.audience.mode === "all"
                            ? t(messages, "clientFollowUpAutomation.ui.audience.all")
                            : a.audience.segment === "inactive60"
                            ? t(messages, "clientFollowUpAutomation.ui.audience.inactive60")
                            : a.audience.segment === "inactive30"
                            ? t(messages, "clientFollowUpAutomation.ui.audience.inactive30")
                            : t(messages, "clientFollowUpAutomation.ui.audience.hasBirthday")}
                        </span>
                      </p>
                      <p className="mt-2 text-xs text-slate-500">
                        {t(messages, "clientFollowUpAutomation.ui.saved.created")}: {formatDate(a.createdAt)}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => deleteAutomation(a.id)}
                      className="rounded-2xl bg-white px-3 py-2 text-xs font-semibold text-slate-900 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
                    >
                      {t(messages, "common.remove")}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </aside>

      {/* Right: Builder */}
      <section className="lg:col-span-8">
        <div className="rounded-[28px] bg-white p-6 ring-1 ring-slate-100">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                {t(messages, "clientFollowUpAutomation.ui.builder.title")}
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                {t(messages, "clientFollowUpAutomation.ui.builder.subtitle")}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={resetTemplate}
                className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
              >
                {t(messages, "clientFollowUpAutomation.ui.builder.reset")}
              </button>
              <button
                type="button"
                onClick={createAutomation}
                className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
              >
                {t(messages, "clientFollowUpAutomation.ui.builder.create")}
              </button>
            </div>
          </div>

          {/* Summary bar */}
          <div className="mt-5 grid gap-3 rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-100 sm:grid-cols-3">
            <div>
              <p className="text-xs font-semibold text-slate-600">
                {t(messages, "clientFollowUpAutomation.ui.summary.trigger")}
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{triggerLabel}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-600">
                {t(messages, "clientFollowUpAutomation.ui.summary.audience")}
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{audienceLabel}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-600">
                {t(messages, "clientFollowUpAutomation.ui.summary.previewClient")}
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {selectedClient ? selectedClient.name : t(messages, "common.unknown")}
              </p>
            </div>
          </div>

          {/* Name */}
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-slate-900">
                {t(messages, "clientFollowUpAutomation.ui.fields.name")}
              </label>
              <input
                value={autoName}
                onChange={(e) => setAutoName(e.target.value)}
                placeholder={t(messages, "clientFollowUpAutomation.ui.fields.namePh")}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-900">
                {t(messages, "clientFollowUpAutomation.ui.fields.previewClient")}
              </label>
              <select
                value={selectedClientId || clients[0]?.id || ""}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400"
              >
                {clients.length === 0 ? (
                  <option value="">{t(messages, "clientFollowUpAutomation.ui.fields.noClients")}</option>
                ) : (
                  clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} • {c.email}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* Trigger + Audience */}
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl bg-white ring-1 ring-slate-100">
              <div className="border-b border-slate-100 p-4">
                <p className="text-sm font-semibold text-slate-900">
                  {t(messages, "clientFollowUpAutomation.ui.trigger.title")}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {t(messages, "clientFollowUpAutomation.ui.trigger.subtitle")}
                </p>
              </div>

              <div className="p-4">
                <div className="grid gap-2 sm:grid-cols-2">
                  {(["birthday", "appointmentReminder", "winback", "customDate"] as TriggerType[]).map((k) => {
                    const active = triggerType === k;
                    const label =
                      k === "birthday"
                        ? t(messages, "clientFollowUpAutomation.ui.triggers.birthday")
                        : k === "appointmentReminder"
                        ? t(messages, "clientFollowUpAutomation.ui.triggers.reminder")
                        : k === "winback"
                        ? t(messages, "clientFollowUpAutomation.ui.triggers.winback")
                        : t(messages, "clientFollowUpAutomation.ui.triggers.customDate");

                    return (
                      <button
                        key={k}
                        type="button"
                        onClick={() => {
                          setTriggerType(k);
                          // keep values, just switch type
                        }}
                        className={[
                          "rounded-2xl px-4 py-3 text-left text-sm font-semibold ring-1 transition",
                          active
                            ? "bg-slate-900 text-white ring-slate-900"
                            : "bg-white text-slate-900 ring-slate-200 hover:bg-slate-50",
                        ].join(" ")}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4">
                  {triggerType === "appointmentReminder" ? (
                    <div>
                      <label className="text-sm font-semibold text-slate-900">
                        {t(messages, "clientFollowUpAutomation.ui.trigger.hoursBefore")}
                      </label>
                      <div className="mt-2 flex items-center gap-2">
                        <input
                          type="number"
                          min={1}
                          max={168}
                          value={hoursBefore}
                          onChange={(e) => setHoursBefore(clampInt(e.target.value, 1, 168, 24))}
                          className="w-28 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400"
                        />
                        <span className="text-sm text-slate-600">
                          {t(messages, "clientFollowUpAutomation.ui.trigger.hours")}
                        </span>
                      </div>
                    </div>
                  ) : null}

                  {triggerType === "winback" ? (
                    <div>
                      <label className="text-sm font-semibold text-slate-900">
                        {t(messages, "clientFollowUpAutomation.ui.trigger.daysSince")}
                      </label>
                      <div className="mt-2 flex items-center gap-2">
                        <input
                          type="number"
                          min={7}
                          max={365}
                          value={daysSinceLast}
                          onChange={(e) => setDaysSinceLast(clampInt(e.target.value, 7, 365, 30))}
                          className="w-28 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400"
                        />
                        <span className="text-sm text-slate-600">
                          {t(messages, "clientFollowUpAutomation.ui.trigger.days")}
                        </span>
                      </div>
                    </div>
                  ) : null}

                  {triggerType === "customDate" ? (
                    <div>
                      <label className="text-sm font-semibold text-slate-900">
                        {t(messages, "clientFollowUpAutomation.ui.trigger.sendAt")}
                      </label>
                      <input
                        type="datetime-local"
                        value={customSendAt}
                        onChange={(e) => setCustomSendAt(e.target.value)}
                        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400"
                      />
                      <p className="mt-2 text-xs text-slate-500">
                        {t(messages, "clientFollowUpAutomation.ui.trigger.sendAtHint")}
                      </p>
                    </div>
                  ) : null}

                  {triggerType === "birthday" ? (
                    <p className="text-xs text-slate-500">
                      {t(messages, "clientFollowUpAutomation.ui.trigger.birthdayHint")}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-white ring-1 ring-slate-100">
              <div className="border-b border-slate-100 p-4">
                <p className="text-sm font-semibold text-slate-900">
                  {t(messages, "clientFollowUpAutomation.ui.audience.title")}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {t(messages, "clientFollowUpAutomation.ui.audience.subtitle")}
                </p>
              </div>

              <div className="p-4">
                <div className="grid gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setAudienceMode("all")}
                    className={[
                      "rounded-2xl px-4 py-3 text-left text-sm font-semibold ring-1 transition",
                      audienceMode === "all"
                        ? "bg-slate-900 text-white ring-slate-900"
                        : "bg-white text-slate-900 ring-slate-200 hover:bg-slate-50",
                    ].join(" ")}
                  >
                    {t(messages, "clientFollowUpAutomation.ui.audience.all")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAudienceMode("segment")}
                    className={[
                      "rounded-2xl px-4 py-3 text-left text-sm font-semibold ring-1 transition",
                      audienceMode === "segment"
                        ? "bg-slate-900 text-white ring-slate-900"
                        : "bg-white text-slate-900 ring-slate-200 hover:bg-slate-50",
                    ].join(" ")}
                  >
                    {t(messages, "clientFollowUpAutomation.ui.audience.segment")}
                  </button>
                </div>

                {audienceMode === "segment" ? (
                  <div className="mt-4">
                    <label className="text-sm font-semibold text-slate-900">
                      {t(messages, "clientFollowUpAutomation.ui.audience.segmentPick")}
                    </label>
                    <select
                      value={segment}
                      onChange={(e) => setSegment(e.target.value as any)}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400"
                    >
                      <option value="hasBirthday">
                        {t(messages, "clientFollowUpAutomation.ui.audience.hasBirthday")}
                      </option>
                      <option value="inactive30">
                        {t(messages, "clientFollowUpAutomation.ui.audience.inactive30")}
                      </option>
                      <option value="inactive60">
                        {t(messages, "clientFollowUpAutomation.ui.audience.inactive60")}
                      </option>
                    </select>
                    <p className="mt-2 text-xs text-slate-500">
                      {t(messages, "clientFollowUpAutomation.ui.audience.segmentHint")}
                    </p>
                  </div>
                ) : (
                  <p className="mt-4 text-xs text-slate-500">
                    {t(messages, "clientFollowUpAutomation.ui.audience.allHint")}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Template */}
          <div className="mt-6 rounded-3xl bg-white ring-1 ring-slate-100">
            <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-4 sm:flex-row sm:items-center">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {t(messages, "clientFollowUpAutomation.ui.template.title")}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {t(messages, "clientFollowUpAutomation.ui.template.subtitle")}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {variableChips.map((x) => (
                  <button
                    key={x.k}
                    type="button"
                    onClick={() => insertVar(x.k)}
                    className="rounded-2xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-900 hover:bg-slate-200"
                    title={x.label}
                  >
                    {x.k}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 p-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-semibold text-slate-900">
                  {t(messages, "clientFollowUpAutomation.ui.template.subject")}
                </label>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder={t(messages, "clientFollowUpAutomation.ui.template.subjectPh")}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400"
                />

                <label className="mt-4 block text-sm font-semibold text-slate-900">
                  {t(messages, "clientFollowUpAutomation.ui.template.body")}
                </label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={10}
                  placeholder={t(messages, "clientFollowUpAutomation.ui.template.bodyPh")}
                  className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400"
                />

                <p className="mt-2 text-xs text-slate-500">
                  {t(messages, "clientFollowUpAutomation.ui.template.hint")}
                </p>
              </div>

              {/* Preview */}
              <div className="rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-100">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">
                    {t(messages, "clientFollowUpAutomation.ui.preview.title")}
                  </p>
                  <span className="rounded-2xl bg-white px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                    {selectedClient ? selectedClient.email : t(messages, "common.unknown")}
                  </span>
                </div>

                <div className="mt-4 rounded-3xl bg-white p-4 ring-1 ring-slate-100">
                  <p className="text-xs font-semibold text-slate-600">
                    {t(messages, "clientFollowUpAutomation.ui.preview.subject")}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {previewSubject || "—"}
                  </p>

                  <p className="mt-4 text-xs font-semibold text-slate-600">
                    {t(messages, "clientFollowUpAutomation.ui.preview.body")}
                  </p>
                  <div className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                    {previewBody || "—"}
                  </div>
                </div>

                <div className="mt-4 rounded-2xl bg-white p-4 ring-1 ring-slate-100">
                  <p className="text-xs font-semibold text-slate-600">
                    {t(messages, "clientFollowUpAutomation.ui.preview.summary")}
                  </p>
                  <p className="mt-1 text-sm text-slate-700">
                    <span className="font-semibold text-slate-900">{triggerLabel}</span>{" "}
                    • <span className="font-semibold text-slate-900">{audienceLabel}</span>
                  </p>

                  {triggerType === "appointmentReminder" ? (
                    <p className="mt-2 text-xs text-slate-500">
                      {t(messages, "clientFollowUpAutomation.ui.preview.reminderHint").replace("{n}", String(hoursBefore))}
                    </p>
                  ) : null}
                  {triggerType === "winback" ? (
                    <p className="mt-2 text-xs text-slate-500">
                      {t(messages, "clientFollowUpAutomation.ui.preview.winbackHint").replace("{n}", String(daysSinceLast))}
                    </p>
                  ) : null}
                  {triggerType === "customDate" ? (
                    <p className="mt-2 text-xs text-slate-500">
                      {t(messages, "clientFollowUpAutomation.ui.preview.customHint").replace(
                        "{date}",
                        formatDate(new Date(customSendAt).toISOString())
                      )}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          {/* Privacy note */}
          <div className="mt-6 rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-100">
            <p className="text-sm font-semibold text-slate-900">
              {t(messages, "clientFollowUpAutomation.ui.privacy.title")}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              {t(messages, "clientFollowUpAutomation.ui.privacy.body")}
            </p>
          </div>
        </div>
      </section>

      {/* Toast */}
      {toast ? (
        <div className="fixed bottom-5 left-1/2 z-50 w-[92%] max-w-md -translate-x-1/2">
          <div
            className={[
              "rounded-2xl px-4 py-3 text-sm font-semibold shadow-lg ring-1 backdrop-blur",
              toast.kind === "ok"
                ? "bg-emerald-600/95 text-white ring-emerald-500"
                : "bg-slate-900/95 text-white ring-slate-700",
            ].join(" ")}
          >
            {toast.msg}
          </div>
        </div>
      ) : null}

      {/* Add client modal */}
      {clientModalOpen ? (
        <Modal
          title={t(messages, "clientFollowUpAutomation.ui.modal.addClientTitle")}
          subtitle={t(messages, "clientFollowUpAutomation.ui.modal.addClientSubtitle")}
          onClose={() => setClientModalOpen(false)}
        >
          <AddClientForm
            messages={messages}
            onCancel={() => setClientModalOpen(false)}
            onAdd={(c) => {
              addClient(c);
              setClientModalOpen(false);
            }}
          />
        </Modal>
      ) : null}

      {/* CSV modal */}
      {csvOpen ? (
        <Modal
          title={t(messages, "clientFollowUpAutomation.ui.modal.csvTitle")}
          subtitle={t(messages, "clientFollowUpAutomation.ui.modal.csvSubtitle")}
          onClose={() => setCsvOpen(false)}
        >
          <CsvImportForm
            messages={messages}
            onCancel={() => setCsvOpen(false)}
            onImport={(text) => {
              importCsv(text);
              setCsvOpen(false);
            }}
          />
        </Modal>
      ) : null}
    </div>
  );
}

/* ---------------- UI helpers ---------------- */

function Modal({
  title,
  subtitle,
  children,
  onClose,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-[28px] bg-white p-6 shadow-2xl ring-1 ring-slate-200">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-base font-semibold text-slate-900">{title}</p>
            {subtitle ? <p className="mt-1 text-sm text-slate-600">{subtitle}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-900 hover:bg-slate-200"
          >
            Close
          </button>
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}

function AddClientForm({
  messages,
  onCancel,
  onAdd,
}: {
  messages: any;
  onCancel: () => void;
  onAdd: (c: Omit<Client, "id">) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [birthday, setBirthday] = useState("");
  const [lastVisit, setLastVisit] = useState("");

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-semibold text-slate-900">
            {t(messages, "clientFollowUpAutomation.ui.clientFields.name")}
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400"
          />
        </div>
        <div>
          <label className="text-sm font-semibold text-slate-900">
            {t(messages, "clientFollowUpAutomation.ui.clientFields.email")}
          </label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-semibold text-slate-900">
            {t(messages, "clientFollowUpAutomation.ui.clientFields.phone")}
            <span className="ml-2 text-xs text-slate-500">{t(messages, "common.optional")}</span>
          </label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400"
          />
        </div>
        <div>
          <label className="text-sm font-semibold text-slate-900">
            {t(messages, "clientFollowUpAutomation.ui.clientFields.birthday")}
            <span className="ml-2 text-xs text-slate-500">{t(messages, "common.optional")}</span>
          </label>
          <input
            type="date"
            value={birthday}
            onChange={(e) => setBirthday(e.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400"
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-semibold text-slate-900">
          {t(messages, "clientFollowUpAutomation.ui.clientFields.lastVisit")}
          <span className="ml-2 text-xs text-slate-500">{t(messages, "common.optional")}</span>
        </label>
        <input
          type="date"
          value={lastVisit}
          onChange={(e) => setLastVisit(e.target.value)}
          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400"
        />
      </div>

      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 ring-1 ring-slate-200 hover:bg-slate-50"
        >
          {t(messages, "common.cancel")}
        </button>
        <button
          type="button"
          onClick={() =>
            onAdd({
              name,
              email,
              phone: phone || undefined,
              birthday: birthday || undefined,
              lastVisit: lastVisit || undefined,
            })
          }
          className="flex-1 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800"
        >
          {t(messages, "clientFollowUpAutomation.ui.modal.addClientCta")}
        </button>
      </div>
    </div>
  );
}

function CsvImportForm({
  messages,
  onCancel,
  onImport,
}: {
  messages: any;
  onCancel: () => void;
  onImport: (text: string) => void;
}) {
  const [text, setText] = useState("");

  return (
    <div className="grid gap-4">
      <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700 ring-1 ring-slate-100">
        <p className="font-semibold text-slate-900">
          {t(messages, "clientFollowUpAutomation.ui.modal.csvFormatTitle")}
        </p>
        <p className="mt-1">{t(messages, "clientFollowUpAutomation.ui.modal.csvFormatBody")}</p>
        <pre className="mt-3 overflow-auto rounded-2xl bg-white p-3 text-xs text-slate-700 ring-1 ring-slate-100">
name,email,phone,birthday,lastVisit
Maria K,maria@email.com,+372...,1994-03-12,2026-02-10
        </pre>
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={8}
        placeholder={t(messages, "clientFollowUpAutomation.ui.modal.csvPh")}
        className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400"
      />

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 ring-1 ring-slate-200 hover:bg-slate-50"
        >
          {t(messages, "common.cancel")}
        </button>
        <button
          type="button"
          onClick={() => onImport(text)}
          className="flex-1 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800"
        >
          {t(messages, "clientFollowUpAutomation.ui.modal.csvCta")}
        </button>
      </div>
    </div>
  );
}