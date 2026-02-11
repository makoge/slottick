"use client";

import { useEffect, useState } from "react";
import { Currency, Service, formatMoney } from "@/lib/services";
import { useMessages } from "@/lib/use-messages";
import { t } from "@/lib/i18n";
import { useParams } from "next/navigation";




const currencyOptions: Currency[] = ["EUR", "USD", "FCFA"];
type DepositType = "PERCENT" | "AMOUNT";

/**
 * Opinion: keep categories curated for Explore + SEO quality.
 * We store the VALUE in DB (English key), but DISPLAY via i18n label.
 */
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
  "Other"
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
    body: form
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
      return t(messages, "services.deposit.labelPercent")
        .replace("{n}", String(clamp(v, 1, 100)));
    }

    return t(messages, "services.deposit.labelAmount").replace(
      "{amount}",
      formatMoney(clamp(v, 1, 1_000_000), s.currency)
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

            images: Array.isArray(s.images) ? s.images.map(String) : []
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
        body: JSON.stringify({ services: next })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || t(messages, "services.errors.saveFailed"));
        return;
      }

      if (Array.isArray(data.services)) {
        const mapped: ServiceWithDeposit[] = (data.services as DbService[]).map((s) => ({
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

          images: Array.isArray(s.images) ? s.images.map(String) : []
        }));
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
      "name" | "category" | "durationMin" | "depositEnabled" | "depositType" | "depositValue" | "images"
    >
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
      depositValue = depositType === "PERCENT" ? clamp(raw, 1, 100) : clamp(raw, 1, 1_000_000);
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
        images: newImages
      },
      ...services
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
    <section className="rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{t(messages, "services.title")}</h2>
        <span className="text-sm text-slate-600">
          {loading
            ? t(messages, "services.status.loading")
            : saving
              ? t(messages, "services.status.saving")
              : saved
                ? t(messages, "services.status.saved")
                : ""}
        </span>
      </div>

      <p className="mt-2 text-sm text-slate-600">{t(messages, "services.lead")}</p>

      {error ? (
        <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      {/* Add form */}
      <form onSubmit={addService} className="mt-5 grid gap-3 rounded-2xl bg-slate-50 p-4">
        <div className="grid min-w-0 gap-3 sm:grid-cols-2">
          <label className="grid min-w-0 gap-1 text-sm">
            {t(messages, "services.form.name")}
            <input
              className="w-full min-w-0 rounded-xl border border-slate-200 px-3 py-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t(messages, "services.form.namePlaceholder")}
              required
              disabled={loading || saving}
            />
          </label>

          <label className="grid min-w-0 gap-1 text-sm">
            {t(messages, "services.form.category")}
            <select
              className="w-full min-w-0 rounded-xl border border-slate-200 px-3 py-2"
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

        <div className="grid min-w-0 gap-3 sm:grid-cols-2">
          <label className="grid min-w-0 gap-1 text-sm">
            {t(messages, "services.form.duration")}
            <input
              type="number"
              min={5}
              step={5}
              className="w-full min-w-0 rounded-xl border border-slate-200 px-3 py-2"
              value={durationMin}
              onChange={(e) => setDurationMin(Number(e.target.value))}
              disabled={loading || saving}
            />
          </label>

          <div className="grid min-w-0 gap-3 sm:grid-cols-[2fr_1fr]">
            <label className="grid min-w-0 gap-1 text-sm">
              {t(messages, "services.form.price")}
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                className="w-full min-w-0 rounded-xl border border-slate-200 px-3 py-3 text-lg font-semibold"
                value={priceText}
                onChange={(e) => setPriceText(e.target.value.replace(/[^\d]/g, ""))}
                disabled={loading || saving}
              />
            </label>

            <label className="grid min-w-0 gap-1 text-sm">
              {t(messages, "services.form.currency")}
              <select
                className="w-full min-w-0 rounded-xl border border-slate-200 px-3 py-3 text-base font-medium"
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

        {/* Work photos for new service */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-medium">{t(messages, "services.photos.title")}</div>

            <label className="cursor-pointer rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold hover:bg-slate-50">
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
            <p className="mt-2 text-xs text-slate-600">{t(messages, "services.photos.hint")}</p>
          ) : (
            <div className="mt-3 grid grid-cols-3 gap-3">
              {newImages.map((url) => (
                <div key={url} className="relative">
                  <img
                    src={url}
                    alt={t(messages, "services.photos.altNew")}
                    className="h-24 w-full rounded-xl border border-slate-200 object-cover"
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-2 rounded-lg bg-white/90 px-2 py-1 text-xs font-semibold"
                    onClick={() => setNewImages((prev) => prev.filter((x) => x !== url))}
                  >
                    {t(messages, "services.actions.remove")}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Deposit controls */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <label className="flex items-center gap-3 text-sm font-medium">
            <input
              type="checkbox"
              checked={depositEnabled}
              onChange={(e) => setDepositEnabled(e.target.checked)}
              disabled={loading || saving}
              className="h-4 w-4"
            />
            {t(messages, "services.deposit.require")}
          </label>

          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <label className="grid gap-1 text-sm">
              {t(messages, "services.deposit.type")}
              <select
                className="w-full rounded-xl border border-slate-200 px-3 py-2"
                value={depositType}
                onChange={(e) => setDepositType(e.target.value as DepositType)}
                disabled={!depositEnabled || loading || saving}
              >
                <option value="PERCENT">{t(messages, "services.deposit.percentOption")}</option>
                <option value="AMOUNT">{t(messages, "services.deposit.amountOption")}</option>
              </select>
            </label>

            <label className="grid gap-1 text-sm">
              {depositType === "PERCENT"
                ? t(messages, "services.deposit.percentLabel")
                : t(messages, "services.deposit.amountLabel")}
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                className="w-full rounded-xl border border-slate-200 px-3 py-2"
                value={depositValueText}
                onChange={(e) => setDepositValueText(e.target.value.replace(/[^\d]/g, ""))}
                disabled={!depositEnabled || loading || saving}
                placeholder={depositType === "PERCENT" ? "20" : "10"}
              />
            </label>

            <div className="grid gap-1 text-sm">
              <div>{t(messages, "services.deposit.shown")}</div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-semibold">
                {depositEnabled
                  ? depositType === "PERCENT"
                    ? t(messages, "services.deposit.labelPercent").replace(
                        "{n}",
                        String(clamp(toPositiveInt(depositValueText, 0), 1, 100))
                      )
                    : t(messages, "services.deposit.labelAmount").replace(
                        "{amount}",
                        formatMoney(clamp(toPositiveInt(depositValueText, 0), 1, 1_000_000), currency)
                      )
                  : t(messages, "services.deposit.none")}
              </div>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || saving || uploadingNewImage}
          className="w-full rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60 sm:w-fit"
        >
          {t(messages, "services.actions.add")}
        </button>
      </form>

      {/* List */}
      <div className="mt-5 grid gap-3">
        {loading ? (
          <div className="rounded-xl border border-slate-200 p-4 text-sm text-slate-600">
            {t(messages, "services.list.loading")}
          </div>
        ) : services.length === 0 ? (
          <div className="rounded-xl border border-slate-200 p-4 text-sm text-slate-600">
            {t(messages, "services.list.empty")}
          </div>
        ) : (
          services.map((s) => {
            const badge = depositLabel(s);
            const imgs = s.images ?? [];

            return (
              <div key={s.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="font-semibold">{s.name}</div>

                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                        {categoryLabel((s.category ?? "Other") as ServiceCategory)}
                      </span>

                      {badge ? (
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                          {badge}
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-1 text-sm text-slate-600">
                      {s.durationMin} {t(messages, "services.minutes")} • {formatMoney(s.price, s.currency)}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => deleteService(s.id)}
                    disabled={saving}
                    className="w-fit rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold hover:bg-slate-50 disabled:opacity-60"
                  >
                    {t(messages, "services.actions.delete")}
                  </button>
                </div>

                {/* Inline edit */}
                <div className="mt-4 grid min-w-0 gap-3 sm:grid-cols-3">
                  <label className="grid gap-1 text-sm">
                    {t(messages, "services.edit.name")}
                    <input
                      className="w-full min-w-0 rounded-xl border border-slate-200 px-3 py-2"
                      value={s.name}
                      onChange={(e) =>
                        updateService(s.id, {
                          name: e.target.value,
                          category: s.category ?? "Other",
                          durationMin: s.durationMin,
                          depositEnabled: s.depositEnabled,
                          depositType: s.depositType,
                          depositValue: s.depositValue,
                          images: s.images
                        })
                      }
                      disabled={saving}
                    />
                  </label>

                  <label className="grid gap-1 text-sm">
                    {t(messages, "services.edit.category")}
                    <select
                      className="w-full rounded-xl border border-slate-200 px-3 py-2"
                      value={s.category ?? "Other"}
                      onChange={(e) =>
                        updateService(s.id, {
                          name: s.name,
                          category: toServiceCategory(e.target.value),
                          durationMin: s.durationMin,
                          depositEnabled: s.depositEnabled,
                          depositType: s.depositType,
                          depositValue: s.depositValue,
                          images: s.images
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

                  <label className="grid gap-1 text-sm">
                    {t(messages, "services.edit.duration")}
                    <input
                      type="number"
                      min={5}
                      step={5}
                      className="w-full min-w-0 rounded-xl border border-slate-200 px-3 py-2"
                      value={s.durationMin}
                      onChange={(e) =>
                        updateService(s.id, {
                          name: s.name,
                          category: s.category ?? "Other",
                          durationMin: Math.max(5, Number(e.target.value) || 5),
                          depositEnabled: s.depositEnabled,
                          depositType: s.depositType,
                          depositValue: s.depositValue,
                          images: s.images
                        })
                      }
                      disabled={saving}
                    />
                  </label>
                </div>

                {/* Images per service */}
                <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-medium">{t(messages, "services.photos.workTitle")}</div>

                    <label className="cursor-pointer rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold hover:bg-slate-50">
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
                              Array.from(new Set([...(s.images ?? []), url])).slice(0, 12)
                            );
                          } catch (err: any) {
                            setError(err?.message || t(messages, "services.errors.uploadFailed"));
                          } finally {
                            e.currentTarget.value = "";
                          }
                        }}
                      />
                    </label>
                  </div>

                  {imgs.length === 0 ? (
                    <p className="mt-2 text-xs text-slate-600">{t(messages, "services.photos.none")}</p>
                  ) : (
                    <div className="mt-3 grid grid-cols-3 gap-3">
                      {imgs.map((url) => (
                        <div key={url} className="relative">
                          <img
                            src={url}
                            alt={t(messages, "services.photos.altWork").replace("{name}", s.name)}
                            className="h-24 w-full rounded-xl border border-slate-200 object-cover"
                          />
                          <button
                            type="button"
                            className="absolute right-2 top-2 rounded-lg bg-white/90 px-2 py-1 text-xs font-semibold"
                            onClick={() => updateServiceImages(s.id, imgs.filter((x) => x !== url))}
                          >
                            {t(messages, "services.actions.remove")}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Deposit edit */}
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <label className="flex items-center gap-3 text-sm font-medium">
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
                          depositValue: e.target.checked ? (s.depositValue ?? 20) : undefined,
                          images: s.images
                        })
                      }
                      disabled={saving}
                      className="h-4 w-4"
                    />
                    {t(messages, "services.deposit.requireShort")}
                  </label>

                  <label className="grid gap-1 text-sm">
                    {t(messages, "services.deposit.type")}
                    <select
                      className="w-full rounded-xl border border-slate-200 px-3 py-2"
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
                              : clamp(Number(s.depositValue ?? 10), 1, 1_000_000),
                          images: s.images
                        })
                      }
                      disabled={saving || !s.depositEnabled}
                    >
                      <option value="PERCENT">{t(messages, "services.deposit.percentOption")}</option>
                      <option value="AMOUNT">{t(messages, "services.deposit.amountOption")}</option>
                    </select>
                  </label>

                  <label className="grid gap-1 text-sm">
                    {t(messages, "services.deposit.value")}
                    <input
                      type="number"
                      min={1}
                      max={(s.depositType ?? "PERCENT") === "PERCENT" ? 100 : 1_000_000}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2"
                      value={Number(s.depositValue ?? ((s.depositType ?? "PERCENT") === "PERCENT" ? 20 : 10))}
                      onChange={(e) => {
                        const raw = Number(e.target.value || 0);
                        const nextVal =
                          (s.depositType ?? "PERCENT") === "PERCENT" ? clamp(raw, 1, 100) : clamp(raw, 1, 1_000_000);

                        updateService(s.id, {
                          name: s.name,
                          category: s.category ?? "Other",
                          durationMin: s.durationMin,
                          depositEnabled: Boolean(s.depositEnabled),
                          depositType: s.depositType ?? "PERCENT",
                          depositValue: nextVal,
                          images: s.images
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
    </section>
  );
}
