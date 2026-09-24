"use client";

import { useEffect, useState } from "react";
import { Currency, Service, formatMoney } from "@/lib/services";
import { useMessages } from "@/lib/use-messages";
import { t } from "@/lib/i18n";
import { useParams } from "next/navigation";

const currencyOptions: Currency[] = ["EUR", "USD", "FCFA"];
type DepositType = "PERCENT" | "AMOUNT";

const SERVICE_CATEGORY_OPTIONS = [
  "Hair",
  "Barber",
  "Lash",
  "Brows",
  "Nails",
  "Manicure",
  "Pedicure",
  "Makeup",
  "Skincare",
  "Massage",
  "Tattoo",
  "Waxing",
  "Facial",
  "Other",
] as const;

type ServiceCategory = (typeof SERVICE_CATEGORY_OPTIONS)[number];

type DbService = {
  id: string;
  name: string;
  category?: string | null;
  durationMin: number;
  price: number;
  currency: string;

  depositEnabled?: boolean;
  depositType?: DepositType;
  depositValue?: number;

  images?: string[];
};

function toCurrency(x: unknown): Currency {
  const s = String(x ?? "EUR").toUpperCase();
  return s === "EUR" || s === "USD" || s === "FCFA" ? (s as Currency) : "EUR";
}

function toServiceCategory(x: unknown): ServiceCategory {
  const s = String(x ?? "").trim();
  const hit = SERVICE_CATEGORY_OPTIONS.find((c) => c === s);
  return hit ?? "Other";
}

function toPositiveInt(x: string, fallback = 0) {
  const n = Number(x);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.floor(n));
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

type ServiceWithDeposit = Service & {
  category?: ServiceCategory;
  depositEnabled?: boolean;
  depositType?: DepositType;
  depositValue?: number;
  images?: string[];
};

async function uploadServiceImage(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch("/api/uploads/service-image", {
    method: "POST",
    body: form,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Image upload failed.");
  if (!data.url) throw new Error("Upload failed: missing url.");

  return String(data.url);
}

export default function ServicesEditor() {
  const params = useParams<{ locale?: string }>();
  const locale = params?.locale ?? "en";

  const messages = useMessages(locale);

  const [services, setServices] = useState<ServiceWithDeposit[]>([]);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // add form
  const [name, setName] = useState("");
  const [category, setCategory] = useState<ServiceCategory>("Hair");
  const [durationMin, setDurationMin] = useState<number>(60);
  const [priceText, setPriceText] = useState<string>("50");
  const [currency, setCurrency] = useState<Currency>("EUR");

  // deposit form
  const [depositEnabled, setDepositEnabled] = useState(false);
  const [depositType, setDepositType] = useState<DepositType>("PERCENT");
  const [depositValueText, setDepositValueText] = useState<string>("20");

  // images for new service
  const [newImages, setNewImages] = useState<string[]>([]);
  const [uploadingNewImage, setUploadingNewImage] = useState(false);

  function categoryLabel(cat: ServiceCategory) {
    return t(messages, `services.categories.${cat}`);
  }

  function depositLabel(s: ServiceWithDeposit) {
    if (!s.depositEnabled) return null;
    const v = Number(s.depositValue || 0);
    if (!v) return null;

    if (s.depositType === "PERCENT") {
      return t(messages, "services.deposit.labelPercent").replace(
        "{n}",
        String(clamp(v, 1, 100)),
      );
    }

    return t(messages, "services.deposit.labelAmount").replace(
      "{amount}",
      formatMoney(clamp(v, 1, 1_000_000), s.currency),
    );
  }

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/services", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setServices([]);
        setError(data.error || t(messages, "services.errors.loadFailed"));
        return;
      }

      const mapped: ServiceWithDeposit[] = Array.isArray(data.services)
        ? (data.services as DbService[]).map((s) => ({
            id: String(s.id),
            name: String(s.name ?? ""),
            category: toServiceCategory(s.category),
            durationMin: Number(s.durationMin ?? 0),
            price: Number(s.price ?? 0),
            currency: toCurrency(s.currency),

            depositEnabled: Boolean(s.depositEnabled),
            depositType: s.depositType === "AMOUNT" ? "AMOUNT" : "PERCENT",
            depositValue:
              s.depositEnabled && Number.isFinite(Number(s.depositValue))
                ? Number(s.depositValue)
                : undefined,

            images: Array.isArray(s.images) ? s.images.map(String) : [],
          }))
        : [];

      setServices(mapped);
    } catch {
      setError(t(messages, "services.errors.networkLoad"));
      setServices([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (cancelled) return;
      await load();
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function persist(next: ServiceWithDeposit[]) {
    setServices(next);
    setSaving(true);
    setSaved(false);
    setError(null);

    try {
      const res = await fetch("/api/services", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ services: next }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || t(messages, "services.errors.saveFailed"));
        return;
      }

      if (Array.isArray(data.services)) {
        const mapped: ServiceWithDeposit[] = (data.services as DbService[]).map(
          (s) => ({
            id: String(s.id),
            name: String(s.name ?? ""),
            category: toServiceCategory(s.category),
            durationMin: Number(s.durationMin ?? 0),
            price: Number(s.price ?? 0),
            currency: toCurrency(s.currency),

            depositEnabled: Boolean(s.depositEnabled),
            depositType: s.depositType === "AMOUNT" ? "AMOUNT" : "PERCENT",
            depositValue:
              s.depositEnabled && Number.isFinite(Number(s.depositValue))
                ? Number(s.depositValue)
                : undefined,

            images: Array.isArray(s.images) ? s.images.map(String) : [],
          }),
        );
        setServices(mapped);
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 1200);
    } catch {
      setError(t(messages, "services.errors.networkSave"));
    } finally {
      setSaving(false);
    }
  }

  function updateServiceImages(id: string, images: string[]) {
    const next = services.map((s) => (s.id === id ? { ...s, images } : s));
    persist(next);
  }

  function updateService(
    id: string,
    patch: Pick<
      ServiceWithDeposit,
      | "name"
      | "category"
      | "durationMin"
      | "depositEnabled"
      | "depositType"
      | "depositValue"
      | "images"
    >,
  ) {
    const next = services.map((s) => (s.id === id ? { ...s, ...patch } : s));
    persist(next);
  }

  function deleteService(id: string) {
    const next = services.filter((s) => s.id !== id);
    persist(next);
  }

  async function addNewImageFromFile(file: File) {
    setUploadingNewImage(true);
    setError(null);
    try {
      const url = await uploadServiceImage(file);
      setNewImages((prev) => Array.from(new Set([...prev, url])).slice(0, 12));
    } catch (e: any) {
      setError(e?.message || t(messages, "services.errors.uploadFailed"));
    } finally {
      setUploadingNewImage(false);
    }
  }

  function addService(e: React.FormEvent) {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) return;

    const price = toPositiveInt(priceText, 0);

    let depositValue: number | undefined = undefined;
    if (depositEnabled) {
      const raw = toPositiveInt(depositValueText, 0);
      depositValue =
        depositType === "PERCENT"
          ? clamp(raw, 1, 100)
          : clamp(raw, 1, 1_000_000);
      if (!depositValue) return;
    }

    const next: ServiceWithDeposit[] = [
      {
        id: crypto.randomUUID(),
        name: cleanName,
        category,
        durationMin: Math.max(5, Number(durationMin) || 5),
        price,
        currency,
        depositEnabled,
        depositType,
        depositValue,
        images: newImages,
      },
      ...services,
    ];

    persist(next);

    setName("");
    setCategory("Hair");
    setDurationMin(60);
    setPriceText("50");
    setCurrency("EUR");

    setDepositEnabled(false);
    setDepositType("PERCENT");
    setDepositValueText("20");

    setNewImages([]);
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-md border border-lime-300/80 bg-lime-100 font-mono text-[10px] font-bold text-lime-950">
              ✂
            </span>
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-500">
              {t(messages, "services.title")}
            </h3>
          </div>
          <p className="mt-1 text-xs text-slate-600 sm:text-sm">
            {t(messages, "services.lead")}
          </p>
        </div>

        <span className="font-mono text-xs font-semibold text-slate-600">
          {loading
            ? t(messages, "services.status.loading")
            : saving
              ? t(messages, "services.status.saving")
              : saved
                ? `✓ ${t(messages, "services.status.saved")}`
                : ""}
        </span>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-300/80 bg-rose-50/90 p-3.5 font-mono text-xs font-bold text-rose-800 shadow-2xs">
          ✕ {error}
        </div>
      )}

      {/* Add New Service Form */}
      <form
        onSubmit={addService}
        className="space-y-4 rounded-2xl border border-slate-300/80 bg-slate-100/70 p-4 sm:p-5"
      >
        <div className="font-mono text-xs font-bold uppercase tracking-wider text-slate-700">
          Add New Service
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1.5">
            <span className="font-mono text-[11px] font-bold uppercase text-slate-600">
              {t(messages, "services.form.name")}
            </span>
            <input
              className="h-11 w-full rounded-xl border border-slate-300/80 bg-white/90 px-3.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:bg-white focus:outline-none"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t(messages, "services.form.namePlaceholder")}
              required
              disabled={loading || saving}
            />
          </label>

          <label className="space-y-1.5">
            <span className="font-mono text-[11px] font-bold uppercase text-slate-600">
              {t(messages, "services.form.category")}
            </span>
            <select
              className="h-11 w-full rounded-xl border border-slate-300/80 bg-white/90 px-3 font-mono text-xs font-semibold text-slate-900 focus:border-slate-800 focus:bg-white focus:outline-none"
              value={category}
              onChange={(e) => setCategory(e.target.value as ServiceCategory)}
              disabled={loading || saving}
            >
              {SERVICE_CATEGORY_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {categoryLabel(c)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1.5">
            <span className="font-mono text-[11px] font-bold uppercase text-slate-600">
              {t(messages, "services.form.duration")}
            </span>
            <div className="relative flex items-center">
              <input
                type="number"
                min={5}
                step={5}
                className="h-11 w-full rounded-xl border border-slate-300/80 bg-white/90 px-3.5 pr-14 font-mono text-sm font-semibold text-slate-900 focus:border-slate-800 focus:bg-white focus:outline-none"
                value={durationMin}
                onChange={(e) => setDurationMin(Number(e.target.value))}
                disabled={loading || saving}
              />
              <span className="pointer-events-none absolute right-3 font-mono text-xs text-slate-400">
                min
              </span>
            </div>
          </label>

          <div className="grid grid-cols-[2fr_1fr] gap-2">
            <label className="space-y-1.5">
              <span className="font-mono text-[11px] font-bold uppercase text-slate-600">
                {t(messages, "services.form.price")}
              </span>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                className="h-11 w-full rounded-xl border border-slate-300/80 bg-white/90 px-3.5 font-mono text-base font-bold text-slate-900 focus:border-slate-800 focus:bg-white focus:outline-none"
                value={priceText}
                onChange={(e) =>
                  setPriceText(e.target.value.replace(/[^\d]/g, ""))
                }
                disabled={loading || saving}
              />
            </label>

            <label className="space-y-1.5">
              <span className="font-mono text-[11px] font-bold uppercase text-slate-600">
                {t(messages, "services.form.currency")}
              </span>
              <select
                className="h-11 w-full rounded-xl border border-slate-300/80 bg-white/90 px-2 font-mono text-xs font-bold text-slate-900 focus:border-slate-800 focus:bg-white focus:outline-none"
                value={currency}
                onChange={(e) => setCurrency(e.target.value as Currency)}
                disabled={loading || saving}
              >
                {currencyOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {/* Gallery upload for new service */}
        <div className="rounded-xl border border-slate-300/80 bg-white/80 p-3.5 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="font-mono text-xs font-bold uppercase text-slate-700">
              {t(messages, "services.photos.title")}
            </span>

            <label className="inline-flex cursor-pointer items-center rounded-xl border border-slate-300/80 bg-white px-3 py-1.5 font-mono text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50">
              {uploadingNewImage
                ? t(messages, "services.photos.uploading")
                : t(messages, "services.photos.add")}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                disabled={loading || saving || uploadingNewImage}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  await addNewImageFromFile(file);
                  e.currentTarget.value = "";
                }}
              />
            </label>
          </div>

          {newImages.length === 0 ? (
            <p className="mt-1.5 font-mono text-[11px] text-slate-500">
              {t(messages, "services.photos.hint")}
            </p>
          ) : (
            <div className="mt-3 grid grid-cols-3 gap-2.5 sm:grid-cols-4">
              {newImages.map((url) => (
                <div
                  key={url}
                  className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-slate-300/80 bg-slate-100"
                >
                  <img
                    src={url}
                    alt={t(messages, "services.photos.altNew")}
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    className="absolute right-1.5 top-1.5 rounded-lg border border-slate-300/80 bg-white/95 px-2 py-0.5 font-mono text-[10px] font-bold text-rose-600 shadow-2xs hover:bg-white"
                    onClick={() =>
                      setNewImages((prev) => prev.filter((x) => x !== url))
                    }
                  >
                    {t(messages, "services.actions.remove")}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Deposit requirements */}
        <div className="space-y-3 rounded-xl border border-slate-300/80 bg-white/80 p-3.5 backdrop-blur-sm">
          <label className="flex items-center gap-2.5 text-xs font-bold text-slate-800">
            <input
              type="checkbox"
              checked={depositEnabled}
              onChange={(e) => setDepositEnabled(e.target.checked)}
              disabled={loading || saving}
              className="h-4 w-4 rounded-md border-slate-300 text-slate-900 focus:ring-0"
            />
            <span className="font-mono uppercase">
              {t(messages, "services.deposit.require")}
            </span>
          </label>

          <div className="grid gap-3 sm:grid-cols-3">
            <label className="space-y-1">
              <span className="font-mono text-[11px] font-bold uppercase text-slate-600">
                {t(messages, "services.deposit.type")}
              </span>
              <select
                className="h-10 w-full rounded-xl border border-slate-300/80 bg-white px-3 font-mono text-xs font-semibold text-slate-900 focus:border-slate-800 focus:outline-none"
                value={depositType}
                onChange={(e) => setDepositType(e.target.value as DepositType)}
                disabled={!depositEnabled || loading || saving}
              >
                <option value="PERCENT">
                  {t(messages, "services.deposit.percentOption")}
                </option>
                <option value="AMOUNT">
                  {t(messages, "services.deposit.amountOption")}
                </option>
              </select>
            </label>

            <label className="space-y-1">
              <span className="font-mono text-[11px] font-bold uppercase text-slate-600">
                {depositType === "PERCENT"
                  ? t(messages, "services.deposit.percentLabel")
                  : t(messages, "services.deposit.amountLabel")}
              </span>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                className="h-10 w-full rounded-xl border border-slate-300/80 bg-white px-3 font-mono text-xs font-semibold text-slate-900 focus:border-slate-800 focus:outline-none"
                value={depositValueText}
                onChange={(e) =>
                  setDepositValueText(e.target.value.replace(/[^\d]/g, ""))
                }
                disabled={!depositEnabled || loading || saving}
                placeholder={depositType === "PERCENT" ? "20" : "10"}
              />
            </label>

            <div className="space-y-1">
              <span className="font-mono text-[11px] font-bold uppercase text-slate-600">
                {t(messages, "services.deposit.shown")}
              </span>
              <div className="flex h-10 items-center rounded-xl border border-slate-300/80 bg-slate-50 px-3 font-mono text-xs font-bold text-slate-800">
                {depositEnabled
                  ? depositType === "PERCENT"
                    ? t(messages, "services.deposit.labelPercent").replace(
                        "{n}",
                        String(
                          clamp(toPositiveInt(depositValueText, 0), 1, 100),
                        ),
                      )
                    : t(messages, "services.deposit.labelAmount").replace(
                        "{amount}",
                        formatMoney(
                          clamp(
                            toPositiveInt(depositValueText, 0),
                            1,
                            1_000_000,
                          ),
                          currency,
                        ),
                      )
                  : t(messages, "services.deposit.none")}
              </div>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || saving || uploadingNewImage}
          className="inline-flex items-center justify-center rounded-2xl border border-lime-300/80 bg-lime-100 px-6 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-lime-950 shadow-xs transition hover:bg-lime-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {t(messages, "services.actions.add")} →
        </button>
      </form>

      {/* Services List & Inline Customization */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center rounded-2xl border border-slate-300/80 bg-white/60 p-8 font-mono text-xs text-slate-500 animate-pulse">
            {t(messages, "services.list.loading")}
          </div>
        ) : services.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300/80 bg-slate-100/50 p-6 text-center font-mono text-xs text-slate-500">
            {t(messages, "services.list.empty")}
          </div>
        ) : (
          services.map((s) => {
            const badge = depositLabel(s);
            const imgs = s.images ?? [];

            return (
              <div
                key={s.id}
                className="rounded-2xl border border-slate-300/80 bg-white/80 p-4 shadow-2xs backdrop-blur-sm sm:p-5"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-slate-900">{s.name}</span>

                      <span className="rounded-md border border-slate-300/80 bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-700">
                        {categoryLabel(
                          (s.category ?? "Other") as ServiceCategory,
                        )}
                      </span>

                      {badge && (
                        <span className="rounded-md border border-lime-300/80 bg-lime-100 px-2 py-0.5 font-mono text-[10px] font-bold text-lime-950">
                          {badge}
                        </span>
                      )}
                    </div>

                    <div className="font-mono text-xs text-slate-600">
                      <span>
                        {s.durationMin} {t(messages, "services.minutes")}
                      </span>
                      {" • "}
                      <span className="font-bold text-slate-900">
                        {formatMoney(s.price, s.currency)}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => deleteService(s.id)}
                    disabled={saving}
                    className="inline-flex shrink-0 items-center justify-center rounded-xl border border-rose-300/80 bg-rose-50 px-3.5 py-1.5 font-mono text-xs font-semibold text-rose-700 shadow-2xs transition hover:bg-rose-100 active:scale-95 disabled:opacity-50"
                  >
                    {t(messages, "services.actions.delete")}
                  </button>
                </div>

                {/* Inline Editing Controls */}
                <div className="mt-4 grid gap-3 border-t border-slate-200/80 pt-4 sm:grid-cols-3">
                  <label className="space-y-1">
                    <span className="font-mono text-[10px] font-bold uppercase text-slate-500">
                      {t(messages, "services.edit.name")}
                    </span>
                    <input
                      className="h-10 w-full rounded-xl border border-slate-300/80 bg-white/90 px-3 text-xs font-medium text-slate-900 focus:border-slate-800 focus:bg-white focus:outline-none"
                      value={s.name}
                      onChange={(e) =>
                        updateService(s.id, {
                          name: e.target.value,
                          category: s.category ?? "Other",
                          durationMin: s.durationMin,
                          depositEnabled: s.depositEnabled,
                          depositType: s.depositType,
                          depositValue: s.depositValue,
                          images: s.images,
                        })
                      }
                      disabled={saving}
                    />
                  </label>

                  <label className="space-y-1">
                    <span className="font-mono text-[10px] font-bold uppercase text-slate-500">
                      {t(messages, "services.edit.category")}
                    </span>
                    <select
                      className="h-10 w-full rounded-xl border border-slate-300/80 bg-white/90 px-2 font-mono text-xs font-semibold text-slate-900 focus:border-slate-800 focus:bg-white focus:outline-none"
                      value={s.category ?? "Other"}
                      onChange={(e) =>
                        updateService(s.id, {
                          name: s.name,
                          category: toServiceCategory(e.target.value),
                          durationMin: s.durationMin,
                          depositEnabled: s.depositEnabled,
                          depositType: s.depositType,
                          depositValue: s.depositValue,
                          images: s.images,
                        })
                      }
                      disabled={saving}
                    >
                      {SERVICE_CATEGORY_OPTIONS.map((c) => (
                        <option key={c} value={c}>
                          {categoryLabel(c)}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="space-y-1">
                    <span className="font-mono text-[10px] font-bold uppercase text-slate-500">
                      {t(messages, "services.edit.duration")}
                    </span>
                    <div className="relative flex items-center">
                      <input
                        type="number"
                        min={5}
                        step={5}
                        className="h-10 w-full rounded-xl border border-slate-300/80 bg-white/90 px-3 pr-12 font-mono text-xs font-semibold text-slate-900 focus:border-slate-800 focus:bg-white focus:outline-none"
                        value={s.durationMin}
                        onChange={(e) =>
                          updateService(s.id, {
                            name: s.name,
                            category: s.category ?? "Other",
                            durationMin: Math.max(
                              5,
                              Number(e.target.value) || 5,
                            ),
                            depositEnabled: s.depositEnabled,
                            depositType: s.depositType,
                            depositValue: s.depositValue,
                            images: s.images,
                          })
                        }
                        disabled={saving}
                      />
                      <span className="pointer-events-none absolute right-2.5 font-mono text-[10px] text-slate-400">
                        min
                      </span>
                    </div>
                  </label>
                </div>

                {/* Work Photos Management Per Service */}
                <div className="mt-4 rounded-xl border border-slate-300/80 bg-slate-100/60 p-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono text-xs font-bold uppercase text-slate-700">
                      {t(messages, "services.photos.workTitle")}
                    </span>

                    <label className="inline-flex cursor-pointer items-center rounded-xl border border-slate-300/80 bg-white px-3 py-1 font-mono text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50">
                      {t(messages, "services.photos.add")}
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        disabled={saving}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;

                          try {
                            setError(null);
                            const url = await uploadServiceImage(file);
                            updateServiceImages(
                              s.id,
                              Array.from(
                                new Set([...(s.images ?? []), url]),
                              ).slice(0, 12),
                            );
                          } catch (err: any) {
                            setError(
                              err?.message ||
                                t(messages, "services.errors.uploadFailed"),
                            );
                          } finally {
                            e.currentTarget.value = "";
                          }
                        }}
                      />
                    </label>
                  </div>

                  {imgs.length === 0 ? (
                    <p className="mt-1.5 font-mono text-[11px] text-slate-500">
                      {t(messages, "services.photos.none")}
                    </p>
                  ) : (
                    <div className="mt-3 grid grid-cols-3 gap-2.5 sm:grid-cols-4">
                      {imgs.map((url) => (
                        <div
                          key={url}
                          className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-slate-300/80 bg-slate-100"
                        >
                          <img
                            src={url}
                            alt={t(messages, "services.photos.altWork").replace(
                              "{name}",
                              s.name,
                            )}
                            className="h-full w-full object-cover"
                          />
                          <button
                            type="button"
                            className="absolute right-1.5 top-1.5 rounded-lg border border-slate-300/80 bg-white/95 px-2 py-0.5 font-mono text-[10px] font-bold text-rose-600 shadow-2xs hover:bg-white"
                            onClick={() =>
                              updateServiceImages(
                                s.id,
                                imgs.filter((x) => x !== url),
                              )
                            }
                          >
                            {t(messages, "services.actions.remove")}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Inline Deposit Config */}
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-800">
                    <input
                      type="checkbox"
                      checked={Boolean(s.depositEnabled)}
                      onChange={(e) =>
                        updateService(s.id, {
                          name: s.name,
                          category: s.category ?? "Other",
                          durationMin: s.durationMin,
                          depositEnabled: e.target.checked,
                          depositType: s.depositType ?? "PERCENT",
                          depositValue: e.target.checked
                            ? (s.depositValue ?? 20)
                            : undefined,
                          images: s.images,
                        })
                      }
                      disabled={saving}
                      className="h-4 w-4 rounded-md border-slate-300 text-slate-900 focus:ring-0"
                    />
                    <span className="font-mono uppercase">
                      {t(messages, "services.deposit.requireShort")}
                    </span>
                  </label>

                  <label className="space-y-1">
                    <span className="font-mono text-[10px] font-bold uppercase text-slate-500">
                      {t(messages, "services.deposit.type")}
                    </span>
                    <select
                      className="h-9 w-full rounded-xl border border-slate-300/80 bg-white px-2.5 font-mono text-xs font-semibold text-slate-900 focus:border-slate-800 focus:outline-none"
                      value={s.depositType ?? "PERCENT"}
                      onChange={(e) =>
                        updateService(s.id, {
                          name: s.name,
                          category: s.category ?? "Other",
                          durationMin: s.durationMin,
                          depositEnabled: Boolean(s.depositEnabled),
                          depositType: e.target.value as DepositType,
                          depositValue:
                            (e.target.value as DepositType) === "PERCENT"
                              ? clamp(Number(s.depositValue ?? 20), 1, 100)
                              : clamp(
                                  Number(s.depositValue ?? 10),
                                  1,
                                  1_000_000,
                                ),
                          images: s.images,
                        })
                      }
                      disabled={saving || !s.depositEnabled}
                    >
                      <option value="PERCENT">
                        {t(messages, "services.deposit.percentOption")}
                      </option>
                      <option value="AMOUNT">
                        {t(messages, "services.deposit.amountOption")}
                      </option>
                    </select>
                  </label>

                  <label className="space-y-1">
                    <span className="font-mono text-[10px] font-bold uppercase text-slate-500">
                      {t(messages, "services.deposit.value")}
                    </span>
                    <input
                      type="number"
                      min={1}
                      max={
                        (s.depositType ?? "PERCENT") === "PERCENT"
                          ? 100
                          : 1_000_000
                      }
                      className="h-9 w-full rounded-xl border border-slate-300/80 bg-white px-2.5 font-mono text-xs font-semibold text-slate-900 focus:border-slate-800 focus:outline-none"
                      value={Number(
                        s.depositValue ??
                          ((s.depositType ?? "PERCENT") === "PERCENT"
                            ? 20
                            : 10),
                      )}
                      onChange={(e) => {
                        const raw = Number(e.target.value || 0);
                        const nextVal =
                          (s.depositType ?? "PERCENT") === "PERCENT"
                            ? clamp(raw, 1, 100)
                            : clamp(raw, 1, 1_000_000);

                        updateService(s.id, {
                          name: s.name,
                          category: s.category ?? "Other",
                          durationMin: s.durationMin,
                          depositEnabled: Boolean(s.depositEnabled),
                          depositType: s.depositType ?? "PERCENT",
                          depositValue: nextVal,
                          images: s.images,
                        });
                      }}
                      disabled={saving || !s.depositEnabled}
                    />
                  </label>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
