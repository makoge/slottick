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

      const reg = await navigator.serviceWorker.register("/sw.js");
      const existing = await reg.pushManager.getSubscription();

      let sub = existing;
      if (!sub) {
        const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!vapidKey) throw new Error("Missing VAPID public key.");

        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey)
        });
      }

      const json = sub.toJSON();

      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: json.keys,
          userAgent: navigator.userAgent
        })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to save subscription.");

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
          body: JSON.stringify({ endpoint: sub.endpoint })
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
      <div className="text-sm text-slate-500">
        Browser notifications are not supported here.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={enabled ? disablePush : enablePush}
        disabled={busy}
        className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
      >
        {busy
          ? enabled
            ? "Disabling..."
            : "Enabling..."
          : enabled
          ? "Disable desktop notifications"
          : "Enable desktop notifications"}
      </button>

      {error ? <div className="text-sm text-rose-600">{error}</div> : null}
    </div>
  );
}