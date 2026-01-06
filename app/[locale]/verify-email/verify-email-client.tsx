"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false }
};


export default function VerifyEmailClient({
  locale,
  token
}: {
  locale: string;
  token: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "ok" | "err">("loading");
  const [msg, setMsg] = useState("Verifying...");

  useEffect(() => {
    async function run() {
      if (!token) {
        setStatus("err");
        setMsg("Missing token.");
        return;
      }

      const res = await fetch("/api/auth/verify/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setStatus("err");
        setMsg(data.error || "Verification failed.");
        return;
      }

      setStatus("ok");
      setMsg("Email verified ✅ Redirecting to login...");
      setTimeout(() => router.replace(`/${locale}/login`), 900);
    }

    run();
  }, [token, locale, router]);

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-md px-6 py-14">
        <section className="rounded-3xl border border-slate-200 p-8 shadow-sm">
          <h1 className="text-2xl font-bold tracking-tight">Verify email</h1>
          <p className="mt-3 text-slate-600">{msg}</p>

          {status === "err" ? (
            <a className="mt-6 inline-block underline" href={`/${locale}/login`}>
              Go to login
            </a>
          ) : null}
        </section>
      </div>
    </main>
  );
}
