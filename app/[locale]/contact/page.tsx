"use client";

import { useState } from "react";

export default function ContactPage() {
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<null | "ok" | "err">(null);
  const [errMsg, setErrMsg] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    setErrMsg("");

    const form = new FormData(e.currentTarget);
    const payload = Object.fromEntries(form.entries());

    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (res.ok && data.ok) {
      setStatus("ok");
      setShowSuccess(true);
      e.currentTarget.reset();

      setTimeout(() => {
        setShowSuccess(false);
      }, 4000);
    } else {
      setStatus("err");
      setErrMsg(data?.error ?? "Failed to send. Try again.");
    }
  }

  return (
    <div className="w-full pb-20">
      {/* 1. TOP HERO BANNER */}
      <section className="relative w-full border-b border-slate-400/30 bg-white/40 px-4 py-10 shadow-xs backdrop-blur-xl sm:px-8 sm:py-14">
        <div className="mx-auto max-w-6xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-lime-300/80 bg-lime-100 px-3.5 py-1 text-xs font-bold text-lime-950 shadow-xs">
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-lime-900 text-[10px] text-white">
              ✓
            </span>
            <span className="font-mono uppercase tracking-wider">
              Direct Assistance
            </span>
          </div>

          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
            Contact Slottick
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-700 sm:text-base">
            Questions, product feedback, or partnership inquiries? Reach out and
            our team will get back to you within 1–2 business days.
          </p>
        </div>
      </section>

      {/* 2. MAIN SPLIT INTERFACE */}
      <div className="mx-auto mt-10 max-w-6xl px-4 sm:px-8">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-start">
          {/* LEFT: INFORMATION CARDS */}
          <div className="space-y-6 lg:col-span-5">
            <div className="rounded-3xl border border-slate-400/40 bg-white/65 p-6 shadow-sm backdrop-blur-xl sm:p-8">
              <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-500">
                Direct Channels
              </h2>

              <div className="mt-6 space-y-6">
                {/* Support */}
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-lime-300/80 bg-lime-100 font-mono text-xs font-bold text-lime-950 shadow-xs">
                    @
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Technical Support
                    </p>
                    <p className="mt-1 font-mono text-sm font-bold text-slate-900">
                      support@slottick.com
                    </p>
                    <p className="mt-0.5 text-xs text-slate-600">
                      Platform assistance, schedule sync, account help
                    </p>
                  </div>
                </div>

                {/* Business */}
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-300/80 bg-white/90 font-mono text-xs font-bold text-slate-900 shadow-2xs">
                    💼
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Business & Partnerships
                    </p>
                    <p className="mt-1 font-mono text-sm font-bold text-slate-900">
                      hello@slottick.com
                    </p>
                    <p className="mt-0.5 text-xs text-slate-600">
                      Studios, salon chains, regional integrations
                    </p>
                  </div>
                </div>

                {/* Hours */}
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-300/80 bg-white/90 font-mono text-xs font-bold text-slate-900 shadow-2xs">
                    ⏱
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Availability Hours
                    </p>
                    <p className="mt-1 font-mono text-sm font-bold text-slate-900">
                      Mon – Fri, 09:00 – 17:00 (EET)
                    </p>
                    <p className="mt-0.5 text-xs text-slate-600">
                      Weekend tickets queued for Monday morning
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 border-t border-slate-300/70 pt-5">
                <p className="font-mono text-xs text-slate-500">
                  Slottick • Booking management platform for modern service
                  businesses.
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT: CONTACT FORM */}
          <div className="rounded-3xl border border-slate-400/40 bg-white/75 p-6 shadow-xl backdrop-blur-2xl sm:p-9 lg:col-span-7">
            <div className="flex items-center justify-between border-b border-slate-300/70 pb-4">
              <div>
                <h2 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
                  Send us a message
                </h2>
                <p className="mt-1 text-xs text-slate-600">
                  Fill out the form below and we will respond to your direct
                  inbox.
                </p>
              </div>

              <span className="rounded-lg border border-lime-300/80 bg-lime-100 px-2.5 py-1 font-mono text-[11px] font-bold text-lime-950 shadow-2xs">
                Active
              </span>
            </div>

            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              {/* Honeypot spam trap */}
              <input
                name="website"
                tabIndex={-1}
                autoComplete="off"
                className="hidden"
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="font-mono text-xs font-bold uppercase tracking-wider text-slate-700">
                    Your Name
                  </label>
                  <input
                    name="name"
                    required
                    type="text"
                    placeholder="Jane Doe"
                    className="h-11 w-full rounded-2xl border border-slate-300/80 bg-white/90 px-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-mono text-xs font-bold uppercase tracking-wider text-slate-700">
                    Email Address
                  </label>
                  <input
                    name="email"
                    required
                    type="email"
                    placeholder="jane@studio.com"
                    className="h-11 w-full rounded-2xl border border-slate-300/80 bg-white/90 px-4 font-mono text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-mono text-xs font-bold uppercase tracking-wider text-slate-700">
                  Subject
                </label>
                <input
                  name="subject"
                  required
                  type="text"
                  placeholder="How can we assist your business?"
                  className="h-11 w-full rounded-2xl border border-slate-300/80 bg-white/90 px-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-mono text-xs font-bold uppercase tracking-wider text-slate-700">
                  Message
                </label>
                <textarea
                  name="message"
                  required
                  rows={5}
                  placeholder="Tell us what you need help with..."
                  className="w-full resize-y rounded-2xl border border-slate-300/80 bg-white/90 p-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:bg-white focus:outline-none"
                />
              </div>

              <button
                disabled={loading}
                type="submit"
                className="inline-flex w-full items-center justify-center rounded-2xl border border-lime-300/80 bg-lime-100 px-6 py-3.5 font-mono text-xs font-bold uppercase tracking-wider text-lime-950 shadow-xs transition hover:bg-lime-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Sending Message..." : "Send Message →"}
              </button>

              {status === "ok" && (
                <div className="rounded-xl border border-lime-300/90 bg-lime-100 p-3 font-mono text-xs font-bold text-lime-950 shadow-2xs">
                  ✓ Message received! We will reply to your email shortly.
                </div>
              )}

              {status === "err" && (
                <div className="rounded-xl border border-rose-300/80 bg-rose-50 p-3 font-mono text-xs font-bold text-rose-800 shadow-2xs">
                  ✕ {errMsg}
                </div>
              )}

              <p className="border-t border-slate-300/60 pt-3 text-[11px] text-slate-500">
                By submitting this form, you agree to Slottick’s Privacy Policy.
                We never share your data.
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
