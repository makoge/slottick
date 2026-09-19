"use client";

import { useEffect, useMemo, useState } from "react";
import { t } from "@/lib/i18n";

type Client = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  birthday?: string;
  lastVisit?: string;
  appointmentDate?: string; // YYYY-MM-DD
  appointmentTime?: string; // HH:MM
};

type TriggerType =
  | "birthday"
  | "appointmentReminder"
  | "winback"
  | "customDate";

type Automation = {
  id: string;
  name: string;
  trigger: {
    type: TriggerType;
    hoursBefore?: number;
    daysSinceLastVisit?: number;
    sendAt?: string;
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
  const d = new Date(
    isoOrYmd.length === 10 ? `${isoOrYmd}T00:00:00` : isoOrYmd,
  );
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
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
  const [clients, setClients] = useState<Client[]>([]);
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [csvOpen, setCsvOpen] = useState(false);

  const [autoName, setAutoName] = useState<string>("");
  const [triggerType, setTriggerType] = useState<TriggerType>("birthday");
  const [hoursBefore, setHoursBefore] = useState<number>(24);
  const [daysSinceLast, setDaysSinceLast] = useState<number>(30);
  const [customSendAt, setCustomSendAt] = useState<string>(() =>
    isoNowPlusMinutes(60),
  );

  const [audienceMode, setAudienceMode] = useState<"all" | "segment">("all");
  const [segment, setSegment] = useState<
    "hasBirthday" | "inactive30" | "inactive60"
  >("hasBirthday");

  const [subject, setSubject] = useState<string>("");
  const [body, setBody] = useState<string>("");

  const [selectedClientId, setSelectedClientId] = useState<string>("");

  const [toast, setToast] = useState<{
    kind: "ok" | "bad";
    msg: string;
  } | null>(null);
  const [isAuthedBusiness, setIsAuthedBusiness] = useState(false);

  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const toastShow = (kind: "ok" | "bad", msg: string) => {
    setToast({ kind, msg });
    window.setTimeout(() => setToast(null), 2800);
  };

  useEffect(() => {
    try {
      const c = JSON.parse(localStorage.getItem(LS_CLIENTS) ?? "[]");
      if (Array.isArray(c)) setClients(c);
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(LS_CLIENTS, JSON.stringify(clients));
    } catch {}
  }, [clients]);

  useEffect(() => {
    if (subject.trim() || body.trim()) return;

    if (triggerType === "birthday") {
      setSubject(
        t(messages, "clientFollowUpAutomation.ui.templates.birthday.subject"),
      );
      setBody(
        t(messages, "clientFollowUpAutomation.ui.templates.birthday.body"),
      );
      setAutoName(
        t(messages, "clientFollowUpAutomation.ui.templates.birthday.name"),
      );
    } else if (triggerType === "appointmentReminder") {
      setSubject(
        t(messages, "clientFollowUpAutomation.ui.templates.reminder.subject"),
      );
      setBody(
        t(messages, "clientFollowUpAutomation.ui.templates.reminder.body"),
      );
      setAutoName(
        t(messages, "clientFollowUpAutomation.ui.templates.reminder.name"),
      );
    } else if (triggerType === "winback") {
      setSubject(
        t(messages, "clientFollowUpAutomation.ui.templates.winback.subject"),
      );
      setBody(
        t(messages, "clientFollowUpAutomation.ui.templates.winback.body"),
      );
      setAutoName(
        t(messages, "clientFollowUpAutomation.ui.templates.winback.name"),
      );
    } else {
      setSubject(
        t(messages, "clientFollowUpAutomation.ui.templates.custom.subject"),
      );
      setBody(t(messages, "clientFollowUpAutomation.ui.templates.custom.body"));
      setAutoName(
        t(messages, "clientFollowUpAutomation.ui.templates.custom.name"),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerType]);

  const selectedClient = useMemo(
    () => clients.find((c) => c.id === selectedClientId) ?? clients[0],
    [clients, selectedClientId],
  );

  function addClient(c: Omit<Client, "id">) {
    if (!isAuthedBusiness && clients.length >= 10) {
      setUpgradeOpen(true);
      return;
    }
    const name = c.name.trim();
    const email = c.email.trim();

    if (!name || !email) {
      return toastShow(
        "bad",
        t(messages, "clientFollowUpAutomation.ui.toast.clientMissing"),
      );
    }

    if (!isEmail(email)) {
      return toastShow(
        "bad",
        t(messages, "clientFollowUpAutomation.ui.toast.clientEmailBad"),
      );
    }

    if (clients.some((x) => x.email.toLowerCase() === email.toLowerCase())) {
      return toastShow(
        "bad",
        t(messages, "clientFollowUpAutomation.ui.toast.clientDuplicate"),
      );
    }

    const next: Client = { id: uid(), ...c, name, email };
    setClients((p) => [next, ...p]);
    setSelectedClientId(next.id);
    toastShow(
      "ok",
      t(messages, "clientFollowUpAutomation.ui.toast.clientAdded"),
    );
  }

  function removeClient(id: string) {
    setClients((p) => p.filter((x) => x.id !== id));
    if (selectedClientId === id) setSelectedClientId("");
  }

  async function createAutomation() {
    const name = autoName.trim();

    if (!name) {
      return toastShow(
        "bad",
        t(messages, "clientFollowUpAutomation.ui.toast.autoNameMissing"),
      );
    }

    if (!subject.trim() || !body.trim()) {
      return toastShow(
        "bad",
        t(messages, "clientFollowUpAutomation.ui.toast.templateMissing"),
      );
    }

    if (!selectedClient?.email) {
      return toastShow(
        "bad",
        t(messages, "clientFollowUpAutomation.ui.toast.selectClient"),
      );
    }

    if (!isAuthedBusiness && clients.length > 10) {
      setUpgradeOpen(true);
      return;
    }

    if (triggerType === "customDate") {
      const selected = new Date(customSendAt).getTime();
      const max = Date.now() + 30 * 24 * 60 * 60 * 1000;

      if (Number.isNaN(selected) || selected > max) {
        return toastShow(
          "bad",
          t(messages, "clientFollowUpAutomation.ui.toast.customDateTooFar"),
        );
      }
    }

    let computedSendAt: string | undefined;

    if (triggerType === "customDate") {
      computedSendAt = new Date(customSendAt).toISOString();
    }

    if (triggerType === "appointmentReminder") {
      if (
        !selectedClient?.appointmentDate ||
        !selectedClient?.appointmentTime
      ) {
        return toastShow(
          "bad",
          "Add appointment date and time for this client first",
        );
      }

      const appointmentAt = new Date(
        `${selectedClient.appointmentDate}T${selectedClient.appointmentTime}`,
      );

      if (Number.isNaN(appointmentAt.getTime())) {
        return toastShow("bad", "Invalid appointment date or time");
      }

      const sendAt = new Date(
        appointmentAt.getTime() -
          clampInt(hoursBefore, 1, 168, 24) * 60 * 60 * 1000,
      );

      if (sendAt.getTime() <= Date.now()) {
        return toastShow(
          "bad",
          "The reminder time is already in the past. Reduce the hours before appointment.",
        );
      }

      computedSendAt = sendAt.toISOString();
    }

    const a: Automation = {
      id: uid(),
      name,
      trigger:
        triggerType === "birthday"
          ? { type: "birthday" }
          : triggerType === "appointmentReminder"
            ? {
                type: "appointmentReminder",
                hoursBefore: clampInt(hoursBefore, 1, 168, 24),
                sendAt: computedSendAt,
              }
            : triggerType === "winback"
              ? {
                  type: "winback",
                  daysSinceLastVisit: clampInt(daysSinceLast, 7, 365, 30),
                }
              : { type: "customDate", sendAt: computedSendAt },
      template: {
        subject: subject.trim(),
        body: body.trim(),
      },
      audience:
        audienceMode === "all" ? { mode: "all" } : { mode: "segment", segment },
      createdAt: new Date().toISOString(),
    };

    try {
      if (isAuthedBusiness) {
        const res = await fetch("/api/tools/automations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...a,
            client: {
              id: selectedClient.id,
              name: selectedClient.name,
              email: selectedClient.email,
              phone: selectedClient.phone ?? null,
              birthday: selectedClient.birthday ?? null,
              lastVisit: selectedClient.lastVisit ?? null,
              appointmentDate: selectedClient.appointmentDate ?? null,
              appointmentTime: selectedClient.appointmentTime ?? null,
            },
          }),
        });

        const text = await res.text();
        let data: any = {};
        try {
          data = text ? JSON.parse(text) : {};
        } catch {
          data = {};
        }

        if (!res.ok || !data?.ok) {
          throw new Error(data?.error || "Failed to save automation");
        }
      } else {
        const sendAt = computedSendAt;

        const res = await fetch("/api/client-follow-up/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            to: selectedClient.email,
            subject: renderTemplate(subject.trim(), selectedClient),
            html: renderTemplate(body.trim(), selectedClient),
            sendAt,
            website: "", // honeypot
          }),
        });

        const text = await res.text();
        const data = text ? JSON.parse(text) : {};

        if (!res.ok || !data?.ok) {
          throw new Error(data?.error || "Failed to send email");
        }

        const existing = JSON.parse(
          localStorage.getItem(LS_AUTOS) ?? "[]",
        ) as Automation[];
        localStorage.setItem(LS_AUTOS, JSON.stringify([a, ...existing]));
      }

      toastShow(
        "ok",
        t(messages, "clientFollowUpAutomation.ui.toast.autoScheduled"),
      );
    } catch (err) {
      console.error("[createAutomation] failed:", err);
      toastShow(
        "bad",
        t(messages, "clientFollowUpAutomation.ui.toast.saveFail"),
      );
    }
  }

  function resetTemplate() {
    setSubject("");
    setBody("");
    setAutoName("");
    toastShow(
      "ok",
      t(messages, "clientFollowUpAutomation.ui.toast.templateReset"),
    );
  }

  function importCsv(text: string) {
    const lines = text
      .split(/\r?\n/)
      .map((x) => x.trim())
      .filter(Boolean);

    if (!lines.length) {
      return toastShow(
        "bad",
        t(messages, "clientFollowUpAutomation.ui.toast.csvEmpty"),
      );
    }

    const header = lines[0].toLowerCase();
    const start = header.includes("email") ? 1 : 0;

    const toAdd: Client[] = [];

    for (let i = start; i < lines.length; i++) {
      const parts = lines[i].split(",").map((x) => x.trim());
      const [
        name,
        email,
        phone,
        birthday,
        lastVisit,
        appointmentDate,
        appointmentTime,
      ] = parts;

      if (!name || !email || !isEmail(email)) continue;
      if (clients.some((x) => x.email.toLowerCase() === email.toLowerCase()))
        continue;
      if (toAdd.some((x) => x.email.toLowerCase() === email.toLowerCase()))
        continue;

      toAdd.push({
        id: uid(),
        name,
        email,
        phone: phone || undefined,
        birthday: birthday || undefined,
        lastVisit: lastVisit || undefined,
        appointmentDate: appointmentDate || undefined,
        appointmentTime: appointmentTime || undefined,
      });
    }

    if (!toAdd.length) {
      return toastShow(
        "bad",
        t(messages, "clientFollowUpAutomation.ui.toast.csvNone"),
      );
    }

    const allowedToAdd = !isAuthedBusiness
      ? Math.max(0, 10 - clients.length)
      : toAdd.length;

    const finalToAdd = toAdd.slice(0, allowedToAdd);

    if (!finalToAdd.length) {
      return toastShow(
        "bad",
        t(messages, "clientFollowUpAutomation.ui.toast.guestLimit"),
      );
    }

    setClients((p) => [...finalToAdd, ...p]);
    setSelectedClientId((prev) => prev || finalToAdd[0].id);

    toastShow(
      "ok",
      t(messages, "clientFollowUpAutomation.ui.toast.csvImported").replace(
        "{n}",
        String(finalToAdd.length),
      ),
    );
  }

  const previewSubject = useMemo(
    () => renderTemplate(subject, selectedClient),
    [subject, selectedClient],
  );
  const previewBody = useMemo(
    () => renderTemplate(body, selectedClient),
    [body, selectedClient],
  );

  useEffect(() => {
    fetch("/api/businesses")
      .then((r) => r.json())
      .then((d) => {
        if (d.business) setIsAuthedBusiness(true);
        else setIsAuthedBusiness(false);
      })
      .catch(() => setIsAuthedBusiness(false));
  }, []);

  return (
    <div className="grid min-w-0 gap-8 lg:grid-cols-12">
      {/* LEFT: CLIENT ROSTER MANAGEMENT */}
      <aside className="min-w-0 lg:col-span-4">
        <div className="rounded-3xl border border-slate-300/80 bg-white/70 p-5 shadow-sm backdrop-blur-xl">
          <div className="flex items-start justify-between gap-2 border-b border-slate-200/80 pb-4">
            <div>
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-500">
                {t(messages, "clientFollowUpAutomation.ui.clients.title")}
              </h3>
              <p className="mt-1 text-xs text-slate-600">
                {t(messages, "clientFollowUpAutomation.ui.clients.subtitle")}
              </p>
            </div>

            <div className="flex shrink-0 gap-1.5">
              <button
                type="button"
                onClick={() => setCsvOpen(true)}
                className="rounded-xl border border-slate-300/80 bg-white px-2.5 py-1.5 font-mono text-[11px] font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 active:scale-95"
              >
                {t(messages, "clientFollowUpAutomation.ui.clients.importCsv")}
              </button>
              <button
                type="button"
                onClick={() => setClientModalOpen(true)}
                className="rounded-xl border border-lime-300/80 bg-lime-100 px-2.5 py-1.5 font-mono text-[11px] font-bold text-lime-950 shadow-2xs hover:bg-lime-200 active:scale-95"
              >
                {t(messages, "clientFollowUpAutomation.ui.clients.add")}
              </button>
            </div>
          </div>

          <div className="mt-4">
            {clients.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300/90 bg-slate-100/60 p-4 text-center text-xs text-slate-600">
                <p className="font-semibold text-slate-900">
                  {t(
                    messages,
                    "clientFollowUpAutomation.ui.clients.emptyTitle",
                  )}
                </p>
                <p className="mt-1">
                  {t(messages, "clientFollowUpAutomation.ui.clients.emptyBody")}
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[640px] overflow-y-auto pr-1">
                {clients.map((c) => {
                  const active = (selectedClientId || clients[0]?.id) === c.id;
                  return (
                    <div
                      key={c.id}
                      onClick={() => setSelectedClientId(c.id)}
                      className={`group cursor-pointer rounded-2xl border p-3.5 transition-all active:scale-[0.99] ${
                        active
                          ? "border-lime-300/90 bg-lime-100 text-lime-950 shadow-xs"
                          : "border-slate-300/70 bg-white/80 text-slate-800 hover:border-slate-400 hover:bg-white"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-bold sm:text-sm">
                            {c.name}
                          </p>
                          <p className="truncate font-mono text-[11px] opacity-75">
                            {c.email}
                          </p>

                          <div className="mt-2.5 flex flex-wrap gap-1.5 font-mono text-[10px]">
                            {c.birthday && (
                              <span className="rounded-md border border-black/10 bg-black/5 px-1.5 py-0.5">
                                🎂 {formatDate(c.birthday)}
                              </span>
                            )}
                            {c.lastVisit && (
                              <span className="rounded-md border border-black/10 bg-black/5 px-1.5 py-0.5">
                                ⏱ {formatDate(c.lastVisit)}
                              </span>
                            )}
                            {c.appointmentDate && (
                              <span className="rounded-md border border-black/10 bg-black/5 px-1.5 py-0.5">
                                📅 {formatDate(c.appointmentDate)}{" "}
                                {c.appointmentTime ?? ""}
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeClient(c.id);
                          }}
                          className="rounded-lg p-1 text-[11px] font-bold opacity-60 hover:opacity-100 hover:text-rose-600"
                          title={t(messages, "common.remove")}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* RIGHT: AUTOMATION WORKFLOW BUILDER */}
      <section className="min-w-0 lg:col-span-8 space-y-6">
        <div className="rounded-3xl border border-slate-300/80 bg-white/70 p-6 shadow-sm backdrop-blur-xl sm:p-7">
          <div>
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-500">
              {t(messages, "clientFollowUpAutomation.ui.builder.title")}
            </span>
            <p className="mt-1 text-xs text-slate-600 sm:text-sm">
              {t(messages, "clientFollowUpAutomation.ui.builder.subtitle")}
            </p>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="font-mono text-xs font-bold uppercase text-slate-700">
                {t(messages, "clientFollowUpAutomation.ui.fields.name")}
              </label>
              <input
                value={autoName}
                onChange={(e) => setAutoName(e.target.value)}
                placeholder={t(
                  messages,
                  "clientFollowUpAutomation.ui.fields.namePh",
                )}
                className="mt-1.5 h-11 w-full rounded-2xl border border-slate-300/80 bg-white px-4 text-sm font-medium text-slate-900 focus:border-slate-800 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-mono text-xs font-bold uppercase text-slate-700">
                {t(
                  messages,
                  "clientFollowUpAutomation.ui.fields.previewClient",
                )}
              </label>
              <select
                value={selectedClientId || clients[0]?.id || ""}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="mt-1.5 h-11 w-full rounded-2xl border border-slate-300/80 bg-white px-4 font-mono text-xs font-medium text-slate-900 focus:border-slate-800 focus:outline-none"
              >
                {clients.length === 0 ? (
                  <option value="">
                    {t(
                      messages,
                      "clientFollowUpAutomation.ui.fields.noClients",
                    )}
                  </option>
                ) : (
                  clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.email})
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* TRIGGER & AUDIENCE CONFIG */}
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            {/* Trigger panel */}
            <div className="rounded-2xl border border-slate-300/80 bg-slate-100/60 p-4">
              <p className="font-mono text-xs font-bold uppercase text-slate-700">
                {t(messages, "clientFollowUpAutomation.ui.trigger.title")}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                {t(messages, "clientFollowUpAutomation.ui.trigger.subtitle")}
              </p>

              <div className="mt-4 grid grid-cols-2 gap-2">
                {(
                  [
                    "birthday",
                    "appointmentReminder",
                    "winback",
                    "customDate",
                  ] as TriggerType[]
                ).map((k) => {
                  const unavailable = k === "birthday" || k === "winback";
                  const active = triggerType === k && !unavailable;

                  const label =
                    k === "birthday"
                      ? t(
                          messages,
                          "clientFollowUpAutomation.ui.triggers.birthday",
                        )
                      : k === "appointmentReminder"
                        ? t(
                            messages,
                            "clientFollowUpAutomation.ui.triggers.reminder",
                          )
                        : k === "winback"
                          ? t(
                              messages,
                              "clientFollowUpAutomation.ui.triggers.winback",
                            )
                          : t(
                              messages,
                              "clientFollowUpAutomation.ui.triggers.customDate",
                            );

                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => {
                        if (unavailable) {
                          toastShow(
                            "bad",
                            t(
                              messages,
                              "clientFollowUpAutomation.ui.toast.triggerUnavailable",
                            ),
                          );
                          return;
                        }
                        setTriggerType(k);
                      }}
                      className={`rounded-xl border p-2.5 text-left transition-all ${
                        unavailable
                          ? "border-slate-200 bg-slate-200/50 text-slate-400 cursor-not-allowed"
                          : active
                            ? "border-lime-300/90 bg-lime-100 text-lime-950 shadow-2xs font-bold"
                            : "border-slate-300/80 bg-white text-slate-700 hover:bg-slate-50 font-medium"
                      }`}
                    >
                      <span className="block font-mono text-xs">{label}</span>
                      {unavailable && (
                        <span className="mt-1 block font-mono text-[9px] text-slate-400 uppercase">
                          {t(
                            messages,
                            "clientFollowUpAutomation.ui.triggers.comingSoon",
                          )}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Trigger parameter inputs */}
              <div className="mt-4 pt-3 border-t border-slate-200">
                {triggerType === "appointmentReminder" && (
                  <label className="block">
                    <span className="font-mono text-xs font-bold text-slate-700">
                      {t(
                        messages,
                        "clientFollowUpAutomation.ui.trigger.hoursBefore",
                      )}
                    </span>
                    <div className="mt-1 flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={168}
                        value={hoursBefore}
                        onChange={(e) =>
                          setHoursBefore(clampInt(e.target.value, 1, 168, 24))
                        }
                        className="h-10 w-24 rounded-xl border border-slate-300/80 bg-white px-3 font-mono text-xs text-slate-900 focus:outline-none"
                      />
                      <span className="font-mono text-xs text-slate-500">
                        {t(
                          messages,
                          "clientFollowUpAutomation.ui.trigger.hours",
                        )}
                      </span>
                    </div>
                  </label>
                )}

                {triggerType === "winback" && (
                  <label className="block">
                    <span className="font-mono text-xs font-bold text-slate-700">
                      {t(
                        messages,
                        "clientFollowUpAutomation.ui.trigger.daysSince",
                      )}
                    </span>
                    <div className="mt-1 flex items-center gap-2">
                      <input
                        type="number"
                        min={7}
                        max={365}
                        value={daysSinceLast}
                        onChange={(e) =>
                          setDaysSinceLast(clampInt(e.target.value, 7, 365, 30))
                        }
                        className="h-10 w-24 rounded-xl border border-slate-300/80 bg-white px-3 font-mono text-xs text-slate-900 focus:outline-none"
                      />
                      <span className="font-mono text-xs text-slate-500">
                        {t(
                          messages,
                          "clientFollowUpAutomation.ui.trigger.days",
                        )}
                      </span>
                    </div>
                  </label>
                )}

                {triggerType === "customDate" && (
                  <div>
                    <label className="font-mono text-xs font-bold text-slate-700">
                      {t(
                        messages,
                        "clientFollowUpAutomation.ui.trigger.sendAt",
                      )}
                    </label>
                    <input
                      type="datetime-local"
                      value={customSendAt}
                      onChange={(e) => setCustomSendAt(e.target.value)}
                      className="mt-1 h-10 w-full rounded-xl border border-slate-300/80 bg-white px-3 font-mono text-xs text-slate-900 focus:outline-none"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Audience panel */}
            <div className="rounded-2xl border border-slate-300/80 bg-slate-100/60 p-4">
              <p className="font-mono text-xs font-bold uppercase text-slate-700">
                {t(messages, "clientFollowUpAutomation.ui.audience.title")}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                {t(messages, "clientFollowUpAutomation.ui.audience.subtitle")}
              </p>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAudienceMode("all")}
                  className={`rounded-xl border p-2.5 font-mono text-xs transition-all ${
                    audienceMode === "all"
                      ? "border-lime-300/90 bg-lime-100 text-lime-950 shadow-2xs font-bold"
                      : "border-slate-300/80 bg-white text-slate-700 hover:bg-slate-50 font-medium"
                  }`}
                >
                  {t(messages, "clientFollowUpAutomation.ui.audience.all")}
                </button>

                <button
                  type="button"
                  onClick={() => setAudienceMode("segment")}
                  className={`rounded-xl border p-2.5 font-mono text-xs transition-all ${
                    audienceMode === "segment"
                      ? "border-lime-300/90 bg-lime-100 text-lime-950 shadow-2xs font-bold"
                      : "border-slate-300/80 bg-white text-slate-700 hover:bg-slate-50 font-medium"
                  }`}
                >
                  {t(messages, "clientFollowUpAutomation.ui.audience.segment")}
                </button>
              </div>

              {audienceMode === "segment" && (
                <div className="mt-4 pt-3 border-t border-slate-200">
                  <label className="font-mono text-xs font-bold text-slate-700">
                    {t(
                      messages,
                      "clientFollowUpAutomation.ui.audience.segmentPick",
                    )}
                  </label>
                  <select
                    value={segment}
                    onChange={(e) => setSegment(e.target.value as any)}
                    className="mt-1.5 h-10 w-full rounded-xl border border-slate-300/80 bg-white px-3 font-mono text-xs text-slate-900 focus:outline-none"
                  >
                    <option value="hasBirthday">
                      {t(
                        messages,
                        "clientFollowUpAutomation.ui.audience.hasBirthday",
                      )}
                    </option>
                    <option value="inactive30">
                      {t(
                        messages,
                        "clientFollowUpAutomation.ui.audience.inactive30",
                      )}
                    </option>
                    <option value="inactive60">
                      {t(
                        messages,
                        "clientFollowUpAutomation.ui.audience.inactive60",
                      )}
                    </option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* TEMPLATE EDITOR & LIVE PREVIEW */}
          <div className="mt-6 rounded-2xl border border-slate-300/80 bg-white/80 p-5">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Template fields */}
              <div>
                <label className="font-mono text-xs font-bold uppercase text-slate-700">
                  {t(messages, "clientFollowUpAutomation.ui.template.subject")}
                </label>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder={t(
                    messages,
                    "clientFollowUpAutomation.ui.template.subjectPh",
                  )}
                  className="mt-1.5 h-10 w-full rounded-xl border border-slate-300/80 bg-white px-3 text-xs font-medium text-slate-900 focus:outline-none"
                />

                <label className="mt-3.5 block font-mono text-xs font-bold uppercase text-slate-700">
                  {t(messages, "clientFollowUpAutomation.ui.template.body")}
                </label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={10}
                  placeholder={t(
                    messages,
                    "clientFollowUpAutomation.ui.template.bodyPh",
                  )}
                  className="mt-1.5 w-full resize-y rounded-xl border border-slate-300/80 bg-white p-3 font-mono text-xs text-slate-900 focus:outline-none"
                />

                <p className="mt-2 font-mono text-[11px] text-slate-500">
                  Variables: {"{name}"}, {"{firstName}"}, {"{email}"}
                </p>
              </div>

              {/* Dynamic preview */}
              <div className="rounded-xl border border-slate-300/80 bg-slate-50/70 p-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="font-mono text-[11px] font-bold uppercase text-slate-500">
                    {t(messages, "clientFollowUpAutomation.ui.preview.title")}
                  </span>
                  <span className="rounded bg-white px-2 py-0.5 font-mono text-[10px] text-slate-600 border border-slate-200">
                    To:{" "}
                    {selectedClient ? selectedClient.email : "client@email.com"}
                  </span>
                </div>

                <div className="mt-3">
                  <div className="font-mono text-[11px] text-slate-500">
                    Subject:
                  </div>
                  <div className="text-xs font-bold text-slate-900">
                    {previewSubject || "—"}
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-200">
                  <div className="font-mono text-[11px] text-slate-500 mb-1">
                    Body Preview:
                  </div>
                  <div className="whitespace-pre-wrap rounded-lg bg-white p-3 font-mono text-xs leading-relaxed text-slate-800 border border-slate-200/80">
                    {previewBody || "—"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={resetTemplate}
              className="rounded-xl border border-slate-300/80 bg-white px-5 py-2.5 font-mono text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 active:scale-95"
            >
              {t(messages, "clientFollowUpAutomation.ui.builder.reset")}
            </button>

            <button
              type="button"
              onClick={createAutomation}
              className="rounded-xl border border-lime-300/80 bg-lime-100 px-6 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-lime-950 shadow-xs hover:bg-lime-200 active:scale-95"
            >
              {t(messages, "clientFollowUpAutomation.ui.builder.create")}
            </button>
          </div>
        </div>
      </section>

      {/* TOAST SYSTEM */}
      {toast && (
        <div className="fixed bottom-5 left-1/2 z-50 w-[90%] max-w-md -translate-x-1/2">
          <div
            className={`rounded-2xl border px-4 py-3 text-xs font-semibold shadow-xl backdrop-blur-md ${
              toast.kind === "ok"
                ? "border-lime-300/90 bg-lime-100/95 text-lime-950"
                : "border-rose-300/80 bg-rose-50/95 text-rose-950"
            }`}
          >
            {toast.msg}
          </div>
        </div>
      )}

      {/* MODAL: ADD CLIENT */}
      {clientModalOpen && (
        <Modal
          title={t(
            messages,
            "clientFollowUpAutomation.ui.modal.addClientTitle",
          )}
          subtitle={t(
            messages,
            "clientFollowUpAutomation.ui.modal.addClientSubtitle",
          )}
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
      )}

      {/* MODAL: CSV IMPORT */}
      {csvOpen && (
        <Modal
          title={t(messages, "clientFollowUpAutomation.ui.modal.csvTitle")}
          subtitle={t(
            messages,
            "clientFollowUpAutomation.ui.modal.csvSubtitle",
          )}
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
      )}

      {/* MODAL: UPGRADE */}
      {upgradeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setUpgradeOpen(false)}
          />
          <div className="relative w-full max-w-md rounded-3xl border border-slate-300/80 bg-white/95 p-6 shadow-2xl backdrop-blur-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-4">
              <div>
                <p className="text-base font-extrabold text-slate-900">
                  {t(messages, "clientFollowUpAutomation.ui.upgrade.title")}
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  {t(messages, "clientFollowUpAutomation.ui.upgrade.body")}
                </p>
              </div>
              <button
                onClick={() => setUpgradeOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-900"
              >
                ✕
              </button>
            </div>

            <div className="mt-6 flex gap-3">
              <a
                href="/register"
                className="flex-1 rounded-xl border border-lime-300/80 bg-lime-100 py-3 text-center font-mono text-xs font-bold uppercase tracking-wider text-lime-950 shadow-xs hover:bg-lime-200"
              >
                {t(messages, "clientFollowUpAutomation.ui.upgrade.cta")}
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-slate-300/80 bg-white/95 shadow-2xl backdrop-blur-2xl">
        <div className="border-b border-slate-200/80 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-extrabold text-slate-900">{title}</p>
              {subtitle && (
                <p className="mt-0.5 text-xs text-slate-600">{subtitle}</p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1 text-slate-400 hover:text-slate-900"
            >
              ✕
            </button>
          </div>
        </div>
        <div className="overflow-y-auto p-5">{children}</div>
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
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="font-mono text-xs font-bold text-slate-700">
            {t(messages, "clientFollowUpAutomation.ui.clientFields.name")}
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 h-10 w-full rounded-xl border border-slate-300/80 bg-white px-3 text-xs text-slate-900 focus:outline-none"
            placeholder="Jane Doe"
          />
        </div>
        <div>
          <label className="font-mono text-xs font-bold text-slate-700">
            {t(messages, "clientFollowUpAutomation.ui.clientFields.email")}
          </label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 h-10 w-full rounded-xl border border-slate-300/80 bg-white px-3 text-xs text-slate-900 focus:outline-none"
            placeholder="jane@domain.com"
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="font-mono text-xs font-bold text-slate-700">
            {t(messages, "clientFollowUpAutomation.ui.clientFields.phone")}
          </label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1 h-10 w-full rounded-xl border border-slate-300/80 bg-white px-3 font-mono text-xs text-slate-900 focus:outline-none"
            placeholder="+123..."
          />
        </div>
        <div>
          <label className="font-mono text-xs font-bold text-slate-700">
            {t(messages, "clientFollowUpAutomation.ui.clientFields.birthday")}
          </label>
          <input
            type="date"
            value={birthday}
            onChange={(e) => setBirthday(e.target.value)}
            className="mt-1 h-10 w-full rounded-xl border border-slate-300/80 bg-white px-3 font-mono text-xs text-slate-900 focus:outline-none"
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="font-mono text-[11px] font-bold text-slate-700">
            Last visit
          </label>
          <input
            type="date"
            value={lastVisit}
            onChange={(e) => setLastVisit(e.target.value)}
            className="mt-1 h-10 w-full rounded-xl border border-slate-300/80 bg-white px-2 font-mono text-xs text-slate-900 focus:outline-none"
          />
        </div>
        <div>
          <label className="font-mono text-[11px] font-bold text-slate-700">
            Appt Date
          </label>
          <input
            type="date"
            value={appointmentDate}
            onChange={(e) => setAppointmentDate(e.target.value)}
            className="mt-1 h-10 w-full rounded-xl border border-slate-300/80 bg-white px-2 font-mono text-xs text-slate-900 focus:outline-none"
          />
        </div>
        <div>
          <label className="font-mono text-[11px] font-bold text-slate-700">
            Appt Time
          </label>
          <input
            type="time"
            value={appointmentTime}
            onChange={(e) => setAppointmentTime(e.target.value)}
            className="mt-1 h-10 w-full rounded-xl border border-slate-300/80 bg-white px-2 font-mono text-xs text-slate-900 focus:outline-none"
          />
        </div>
      </div>

      <div className="mt-4 flex gap-2 pt-2 border-t border-slate-200">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-slate-300/80 bg-white px-4 py-2 font-mono text-xs font-semibold text-slate-700 hover:bg-slate-50"
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
              appointmentDate: appointmentDate || undefined,
              appointmentTime: appointmentTime || undefined,
            })
          }
          className="flex-1 rounded-xl border border-lime-300/80 bg-lime-100 px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-lime-950 hover:bg-lime-200"
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
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200/90 bg-slate-50 p-3 font-mono text-xs text-slate-700">
        <p className="font-bold text-slate-900">
          {t(messages, "clientFollowUpAutomation.ui.modal.csvFormatTitle")}
        </p>
        <p className="mt-1 text-[11px] text-slate-500">
          {t(messages, "clientFollowUpAutomation.ui.modal.csvFormatBody")}
        </p>
        <pre className="mt-2 overflow-x-auto rounded-lg bg-white p-2 text-[10px] text-slate-800 border border-slate-200">
          name,email,phone,birthday,lastVisit,appointmentDate,appointmentTime
          Maria K,maria@email.com,+372...,1994-03-12,2026-02-10,2026-03-15,14:00
        </pre>
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={8}
        placeholder={t(messages, "clientFollowUpAutomation.ui.modal.csvPh")}
        className="w-full resize-none rounded-xl border border-slate-300/80 bg-white p-3 font-mono text-xs text-slate-900 focus:outline-none"
      />

      <div className="flex gap-2 pt-2 border-t border-slate-200">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-slate-300/80 bg-white px-4 py-2 font-mono text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          {t(messages, "common.cancel")}
        </button>
        <button
          type="button"
          onClick={() => onImport(text)}
          className="flex-1 rounded-xl border border-lime-300/80 bg-lime-100 px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-lime-950 hover:bg-lime-200"
        >
          {t(messages, "clientFollowUpAutomation.ui.modal.csvCta")}
        </button>
      </div>
    </div>
  );
}
