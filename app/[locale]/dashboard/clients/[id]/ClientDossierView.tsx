"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale } from "@/lib/use-locale";
import { useMessages } from "@/lib/use-messages";
import { t } from "@/lib/i18n";

type RecordItem = {
  id: string;
  serviceName: string;
  date: string;
  formulaNotes: string | null;
  internalNotes: string | null;
  staff?: { name: string; title: string | null } | null;
};

type PhotoItem = {
  id: string;
  url: string;
  type: "BEFORE" | "AFTER" | "FORMULA_CARD";
  caption: string | null;
  createdAt: string;
};

type ClientData = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  allergies: string | null;
  generalNotes: string | null;
  records: RecordItem[];
  photos: PhotoItem[];
};

export default function ClientDossierView({
  locale: initialLocale,
  initialClient,
}: {
  locale?: string;
  initialClient: ClientData;
}) {
  const activeLocale = useLocale(initialLocale || "en");
  const messages = useMessages(activeLocale);

  const tr = (key: string, vars?: Record<string, string | number>) => {
    let s = t(messages, key);
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        s = s.replaceAll(`{${k}}`, String(v));
      }
    }
    return s;
  };

  const [client, setClient] = useState<ClientData>(initialClient);
  const [activeTab, setActiveTab] = useState<
    "records" | "gallery" | "preferences"
  >("records");

  // Record creation state
  const [addingRecord, setAddingRecord] = useState(false);
  const [serviceName, setServiceName] = useState("");
  const [formulaNotes, setFormulaNotes] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Preference edit state
  const [allergies, setAllergies] = useState(client.allergies || "");
  const [generalNotes, setGeneralNotes] = useState(client.generalNotes || "");
  const [savingPrefs, setSavingPrefs] = useState(false);

  async function handleAddRecord(e: React.FormEvent) {
    e.preventDefault();
    if (!serviceName.trim() || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/dashboard/clients/${client.id}/records`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceName, formulaNotes, internalNotes }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setClient((prev) => ({
        ...prev,
        records: [data.record, ...prev.records],
      }));
      setServiceName("");
      setFormulaNotes("");
      setInternalNotes("");
      setAddingRecord(false);
    } catch (err: any) {
      alert(err.message || "Failed to append record");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSavePreferences(e: React.FormEvent) {
    e.preventDefault();
    setSavingPrefs(true);
    try {
      const res = await fetch(`/api/dashboard/clients/${client.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ allergies, generalNotes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setClient((prev) => ({
        ...prev,
        allergies: data.client.allergies,
        generalNotes: data.client.generalNotes,
      }));
      alert("Patron file updated successfully.");
    } catch (err: any) {
      alert(err.message || "Failed to update file");
    } finally {
      setSavingPrefs(false);
    }
  }

  const beforePhotos = client.photos.filter((p) => p.type === "BEFORE");
  const afterPhotos = client.photos.filter((p) => p.type === "AFTER");

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-4 font-sans text-[#251E18] sm:p-8">
      {/* Top Ledger Stamp & Breadcrumbs */}
      <div className="flex flex-col gap-4 border-b border-[#DCD3C4] pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-widest text-[#7C6E5E]">
            ✦ ATELIER PATRON DOSSIER ✦
          </div>
          <h1 className="mt-1 font-serif text-3xl font-medium tracking-tight sm:text-4xl text-[#1E1915]">
            {client.name}
          </h1>
          <p className="mt-1 font-mono text-xs text-[#736555]">
            {client.email || "No email on file"} •{" "}
            {client.phone || "No phone on file"}
          </p>
        </div>

        <Link
          href={`/${activeLocale}/dashboard`}
          className="w-fit rounded-lg border border-[#CEC1AF] bg-[#FAF8F5] px-3.5 py-1.5 font-mono text-xs text-[#4E4135] hover:bg-white"
        >
          ← Return to Dashboard
        </Link>
      </div>

      {/* Warning: Allergy & Sensitivity Alert */}
      {client.allergies && (
        <div className="rounded-xl border border-rose-300 bg-rose-50/80 p-4 font-mono text-xs text-rose-900">
          <strong className="uppercase">
            ⚠️ Sensitivity / Contraindications:
          </strong>{" "}
          {client.allergies}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#E3D9C9] pb-px font-mono text-xs font-bold uppercase tracking-wider">
        <button
          type="button"
          onClick={() => setActiveTab("records")}
          className={`border-b-2 px-4 py-2 transition ${
            activeTab === "records"
              ? "border-[#251E18] text-[#251E18]"
              : "border-transparent text-[#8A7C6D] hover:text-[#251E18]"
          }`}
        >
          📜 Visit History & Formulas ({client.records.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("gallery")}
          className={`border-b-2 px-4 py-2 transition ${
            activeTab === "gallery"
              ? "border-[#251E18] text-[#251E18]"
              : "border-transparent text-[#8A7C6D] hover:text-[#251E18]"
          }`}
        >
          📷 Visual Portfolio ({client.photos.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("preferences")}
          className={`border-b-2 px-4 py-2 transition ${
            activeTab === "preferences"
              ? "border-[#251E18] text-[#251E18]"
              : "border-transparent text-[#8A7C6D] hover:text-[#251E18]"
          }`}
        >
          ⚙️ Preferences & Sensitivities
        </button>
      </div>

      {/* TAB 1: VISIT HISTORY & FORMULA NOTES */}
      {activeTab === "records" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl">Service & Formula Ledger</h2>
            <button
              type="button"
              onClick={() => setAddingRecord(!addingRecord)}
              className="rounded-lg bg-[#251E18] px-3.5 py-1.5 font-mono text-xs font-bold uppercase tracking-wider text-[#FAF6F0] hover:bg-[#3D3228]"
            >
              {addingRecord ? "Cancel" : "+ Log Treatment / Formula"}
            </button>
          </div>

          {/* Add Record Drawer */}
          {addingRecord && (
            <form
              onSubmit={handleAddRecord}
              className="space-y-4 rounded-xl border border-[#D5C9B8] bg-[#F7F2E9] p-5 shadow-sm"
            >
              <div className="font-serif font-bold text-base">
                Inscribe New Treatment Record
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="font-mono text-xs uppercase text-[#635547]">
                    Service Performed *
                  </span>
                  <input
                    required
                    value={serviceName}
                    onChange={(e) => setServiceName(e.target.value)}
                    placeholder="e.g. Skin Fade & Beard Sculpt or Full Balayage"
                    className="mt-1 h-10 w-full rounded-lg border border-[#CEC1AF] bg-white px-3 font-sans text-sm outline-none focus:border-[#251E18]"
                  />
                </label>
                <label className="block">
                  <span className="font-mono text-xs uppercase text-[#635547]">
                    Technical Formula / Specs
                  </span>
                  <input
                    value={formulaNotes}
                    onChange={(e) => setFormulaNotes(e.target.value)}
                    placeholder="e.g. #1.5 guard foil open; Wella 8/38 20vol 30min"
                    className="mt-1 h-10 w-full rounded-lg border border-[#CEC1AF] bg-white px-3 font-mono text-xs outline-none focus:border-[#251E18]"
                  />
                </label>
              </div>

              <label className="block">
                <span className="font-mono text-xs uppercase text-[#635547]">
                  Internal Provider Notes
                </span>
                <textarea
                  rows={2}
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  placeholder="Hair texture, cowlick behavior, conversation topics, or requested tweaks for next session..."
                  className="mt-1 w-full rounded-lg border border-[#CEC1AF] bg-white p-3 font-sans text-xs outline-none focus:border-[#251E18]"
                />
              </label>

              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-[#251E18] px-5 py-2 font-mono text-xs font-bold uppercase tracking-wider text-white disabled:opacity-50"
              >
                {submitting ? "Inscribing..." : "Record Entry →"}
              </button>
            </form>
          )}

          {/* Ledger Records List */}
          <div className="space-y-4">
            {client.records.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#D5C9B8] p-8 text-center font-mono text-xs text-[#8A7C6E]">
                No appointment formulas or visits registered yet.
              </div>
            ) : (
              client.records.map((r) => (
                <div
                  key={r.id}
                  className="rounded-xl border border-[#DFD6C7] bg-white p-5 shadow-2xs space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#F0E9DF] pb-2 font-mono text-xs">
                    <div>
                      <strong className="font-serif text-base text-[#1E1915]">
                        {r.serviceName}
                      </strong>
                      {r.staff && (
                        <span className="ml-2 text-[#7C6E5E]">
                          • Craftsman: {r.staff.name}
                        </span>
                      )}
                    </div>
                    <span className="text-[#8C6D2B]">
                      {new Date(r.date).toLocaleDateString(activeLocale, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>

                  {r.formulaNotes && (
                    <div className="rounded-lg border border-[#E9DFCE] bg-[#FAF7F2] p-3 font-mono text-xs">
                      <span className="uppercase text-[#8C6D2B] font-bold">
                        🧪 Formula / Guard Setup:{" "}
                      </span>
                      <span className="text-[#362D24]">{r.formulaNotes}</span>
                    </div>
                  )}

                  {r.internalNotes && (
                    <p className="font-serif text-xs italic text-[#544638]">
                      "{r.internalNotes}"
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 2: VISUAL PORTFOLIO (BEFORE & AFTER) */}
      {activeTab === "gallery" && (
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-xl">Visual Archives</h2>
              <p className="font-mono text-xs text-[#7A6D5E]">
                Private gallery entries documenting patron transformations
              </p>
            </div>
            <button
              type="button"
              className="rounded-lg border border-[#251E18] px-3.5 py-1.5 font-mono text-xs font-bold uppercase tracking-wider text-[#251E18] hover:bg-[#251E18] hover:text-white transition"
              onClick={() =>
                alert(
                  "Upload photo integration connects to your /api/upload handler.",
                )
              }
            >
              + Upload Portfolio Photo
            </button>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {/* Before Column */}
            <div className="space-y-3">
              <div className="font-mono text-xs uppercase tracking-wider text-[#7A6D5E] border-b border-[#E3D9C9] pb-1">
                Before Service ({beforePhotos.length})
              </div>
              {beforePhotos.length === 0 ? (
                <div className="rounded-lg border border-dashed border-[#DFD6C7] p-6 text-center font-mono text-xs text-[#8A7C6E]">
                  No prior baseline photos recorded.
                </div>
              ) : (
                <div className="grid gap-3">
                  {beforePhotos.map((p) => (
                    <div
                      key={p.id}
                      className="overflow-hidden rounded-xl border border-[#D5C9B8] bg-white"
                    >
                      <img
                        src={p.url}
                        alt="Before"
                        className="h-56 w-full object-cover"
                      />
                      {p.caption && (
                        <div className="p-2.5 font-mono text-xs text-[#524436]">
                          {p.caption}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* After Column */}
            <div className="space-y-3">
              <div className="font-mono text-xs uppercase tracking-wider text-[#7A6D5E] border-b border-[#E3D9C9] pb-1">
                After Service / Result ({afterPhotos.length})
              </div>
              {afterPhotos.length === 0 ? (
                <div className="rounded-lg border border-dashed border-[#DFD6C7] p-6 text-center font-mono text-xs text-[#8A7C6E]">
                  No completed work photos uploaded.
                </div>
              ) : (
                <div className="grid gap-3">
                  {afterPhotos.map((p) => (
                    <div
                      key={p.id}
                      className="overflow-hidden rounded-xl border border-[#D5C9B8] bg-white"
                    >
                      <img
                        src={p.url}
                        alt="After"
                        className="h-56 w-full object-cover"
                      />
                      {p.caption && (
                        <div className="p-2.5 font-mono text-xs text-[#524436]">
                          {p.caption}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SENSITIVITIES & GENERAL PREFERENCES */}
      {activeTab === "preferences" && (
        <form onSubmit={handleSavePreferences} className="max-w-2xl space-y-6">
          <div className="space-y-1">
            <h2 className="font-serif text-xl">Patron Notes & Sensitivities</h2>
            <p className="font-mono text-xs text-[#7A6D5E]">
              Private records accessible exclusively to studio staff during
              service prep.
            </p>
          </div>

          <label className="block space-y-1">
            <span className="font-mono text-xs uppercase tracking-wider text-rose-900 font-bold">
              Allergies, Sensitivities & Contraindications
            </span>
            <input
              value={allergies}
              onChange={(e) => setAllergies(e.target.value)}
              placeholder="e.g. Sensitive scalp, allergy to paraphenylenediamine (PPD), nickel sensitivity"
              className="h-11 w-full rounded-lg border border-rose-300 bg-rose-50/50 px-3.5 font-sans text-xs sm:text-sm text-rose-950 outline-none focus:border-rose-700"
            />
          </label>

          <label className="block space-y-1">
            <span className="font-mono text-xs uppercase tracking-wider text-[#615344]">
              Personal Preferences & Hospitality Notes
            </span>
            <textarea
              rows={4}
              value={generalNotes}
              onChange={(e) => setGeneralNotes(e.target.value)}
              placeholder="e.g. Prefers sparkling water with lemon; quiet appointment preference; parting on the left."
              className="w-full rounded-lg border border-[#D5C9B8] bg-white p-3.5 font-sans text-xs sm:text-sm outline-none focus:border-[#251E18]"
            />
          </label>

          <button
            type="submit"
            disabled={savingPrefs}
            className="rounded-lg bg-[#251E18] px-6 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-white hover:bg-[#3E3228] transition disabled:opacity-50"
          >
            {savingPrefs ? "Preserving..." : "Save Patron Dossier →"}
          </button>
        </form>
      )}
    </div>
  );
}
