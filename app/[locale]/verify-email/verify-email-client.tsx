"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function VerifyEmailClient({
  locale,
  token,
}: {
  locale: string;
  token: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "ok" | "err">("loading");
  const [msg, setMsg] = useState("Verifying token authenticity...");

  useEffect(() => {
    async function run() {
      if (!token) {
        setStatus("err");
        setMsg("Verification token missing or invalid.");
        return;
      }

      try {
        const res = await fetch("/api/auth/verify/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          setStatus("err");
          setMsg(data.error || "Email verification failed or link expired.");
          return;
        }

        setStatus("ok");
        setMsg(
          "Email verified successfully. Redirecting to workspace login...",
        );
        setTimeout(() => router.replace(`/${locale}/login`), 1000);
      } catch {
        setStatus("err");
        setMsg("Network communication error. Please try again.");
      }
    }

    run();
  }, [token, locale, router]);

  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] w-full items-center justify-center px-4 py-12 sm:px-6">
      {/* Ambient background glow accents */}
      <div className="pointer-events-none absolute -top-12 h-64 w-64 rounded-full bg-lime-200/40 blur-3xl sm:h-80 sm:w-80" />
      <div className="pointer-events-none absolute -bottom-12 h-64 w-64 rounded-full bg-slate-400/30 blur-3xl sm:h-80 sm:w-80" />

      {/* Main Glassmorphic Feedback Card */}
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-slate-400/40 bg-white/75 p-6 text-center shadow-xl backdrop-blur-2xl sm:p-9">
        {/* Slottick Identity Pill */}
        <div className="inline-flex items-center gap-2 rounded-full border border-lime-300/80 bg-lime-100 px-3.5 py-1 text-xs font-bold text-lime-950 shadow-xs">
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-lime-900 text-[10px] text-white">
            ✓
          </span>
          <span className="font-mono uppercase tracking-wider">
            Account Security
          </span>
        </div>

        {/* Dynamic Status Icon */}
        <div className="mx-auto mt-6 flex h-20 w-20 items-center justify-center rounded-3xl border shadow-sm backdrop-blur-md">
          {status === "loading" && (
            <div className="flex h-full w-full items-center justify-center rounded-3xl border-slate-300/80 bg-slate-100/90 text-2xl">
              <span className="animate-spin font-mono text-slate-700">⟳</span>
            </div>
          )}
          {status === "ok" && (
            <div className="flex h-full w-full items-center justify-center rounded-3xl border-lime-300/80 bg-lime-100/90 text-2xl">
              <span className="font-mono font-bold text-lime-950">✓</span>
            </div>
          )}
          {status === "err" && (
            <div className="flex h-full w-full items-center justify-center rounded-3xl border-rose-300/80 bg-rose-100/90 text-2xl">
              <span className="text-rose-600">⚠</span>
            </div>
          )}
        </div>

        {/* Heading */}
        <h1 className="mt-6 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          {status === "loading"
            ? "Verifying Email"
            : status === "ok"
              ? "Verified"
              : "Verification Failed"}
        </h1>

        {/* Status Message */}
        <p className="mx-auto mt-2.5 max-w-sm text-sm leading-relaxed text-slate-600">
          {msg}
        </p>

        {/* Status Callout Box */}
        <div
          className={[
            "mt-6 rounded-2xl border p-3.5 font-mono text-xs shadow-2xs backdrop-blur-sm",
            status === "loading"
              ? "border-slate-300/80 bg-slate-100/80 text-slate-700"
              : status === "ok"
                ? "border-lime-300/80 bg-lime-100/80 font-bold text-lime-950"
                : "border-rose-300/80 bg-rose-50/90 font-bold text-rose-800",
          ].join(" ")}
        >
          {status === "loading" && "Status: Validating cryptographic token..."}
          {status === "ok" && "Status: Email signature verified"}
          {status === "err" && "Status: Authentication token rejected"}
        </div>

        {/* Action Button for Error State */}
        {status === "err" && (
          <div className="mt-8 flex justify-center">
            <Link
              href={`/${locale}/login`}
              className="inline-flex items-center justify-center rounded-2xl border border-lime-300/80 bg-lime-100 px-6 py-3 font-mono text-xs font-bold uppercase tracking-wider text-lime-950 shadow-xs transition hover:bg-lime-200 active:scale-95"
            >
              Go to Login →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
