"use client";

import { useEffect, useState } from "react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

export default function PushToggle() {
  const [supported, setSupported] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const ok =
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;
    setSupported(ok);

    if (!ok) return;

    navigator.serviceWorker.getRegistration().then(async (reg) => {
      if (!reg) return setEnabled(false);
      const sub = await reg.pushManager.getSubscription();
      setEnabled(!!sub);
    });
  }, []);

  async function enablePush() {
    try {
      setBusy(true);
      setError("");

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setError("Notifications were not allowed.");
        return;
      }

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
      if (!vapidKey) {
        throw new Error("Missing VAPID public key.");
      }

      await navigator.serviceWorker.register("/sw.js");

      const reg = await navigator.serviceWorker.ready;

      let sub = await reg.pushManager.getSubscription();

      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        });
      }

      const json = sub.toJSON();

      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: json.keys,
          userAgent: navigator.userAgent,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok)
        throw new Error(data?.error || "Failed to save subscription.");

      setEnabled(true);
    } catch (err: any) {
      setError(err?.message || "Failed to enable notifications.");
    } finally {
      setBusy(false);
    }
  }

  async function disablePush() {
    try {
      setBusy(true);
      setError("");

      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();

      if (sub) {
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });

        await sub.unsubscribe();
      }

      setEnabled(false);
    } catch (err: any) {
      setError(err?.message || "Failed to disable notifications.");
    } finally {
      setBusy(false);
    }
  }

  if (!supported) {
    return (
      <div className="inline-flex items-center gap-2 rounded-xl border border-slate-300/80 bg-slate-100/70 px-3.5 py-2 font-mono text-xs text-slate-500">
        <span>⚠</span>
        <span>Browser notifications are not supported on this device.</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={enabled ? disablePush : enablePush}
          disabled={busy}
          className={[
            "inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 font-mono text-xs font-bold uppercase tracking-wider transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-50",
            enabled
              ? "border-slate-300/80 bg-white/90 text-slate-800 shadow-2xs hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700"
              : "border-lime-300/80 bg-lime-100 text-lime-950 shadow-xs hover:bg-lime-200",
          ].join(" ")}
        >
          <span
            className={[
              "flex h-2 w-2 rounded-full",
              enabled ? "bg-emerald-500" : "bg-slate-400",
            ].join(" ")}
          />
          <span>
            {busy
              ? enabled
                ? "Disabling..."
                : "Enabling..."
              : enabled
                ? "Disable Alerts"
                : "Enable Push Alerts →"}
          </span>
        </button>

        <span className="font-mono text-xs text-slate-500">
          Status:{" "}
          <strong className={enabled ? "text-emerald-700" : "text-slate-600"}>
            {enabled ? "Active" : "Disabled"}
          </strong>
        </span>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-300/80 bg-rose-50/90 px-3.5 py-2 font-mono text-xs font-semibold text-rose-800 shadow-2xs">
          ✕ {error}
        </div>
      ) : null}
    </div>
  );
}
