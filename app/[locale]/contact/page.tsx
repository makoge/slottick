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
    <section className="mx-auto max-w-5xl px-6 py-20">
      <div className="grid gap-14 md:grid-cols-2">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Contact Slottick</h1>

          <p className="mt-4 max-w-md text-lg text-slate-600">
            Questions, feedback, or business inquiries? Reach out, we usually
            reply within 1–2 business days.
          </p>

          <div className="mt-10 space-y-6 text-slate-700">
            <div>
              <p className="text-sm font-semibold text-slate-900">Support</p>
              <p>support@slottick.com</p>
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-900">
                Business & partnerships
              </p>
              <p>hello@slottick.com</p>
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-900">Availability</p>
              <p>Monday – Friday, 9:00 – 17:00 (EET)</p>
            </div>
          </div>

          <p className="mt-10 text-sm text-slate-500">
            Slottick is a booking management platform for service businesses.
          </p>
        </div>

        {/* RIGHT: FORM */}
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-xl font-semibold tracking-tight">Send us a message</h2>

          <form onSubmit={onSubmit} className="mt-6 grid gap-5">
            {/* honeypot (spam trap) */}
            <input
              name="website"
              tabIndex={-1}
              autoComplete="off"
              className="hidden"
            />

            <div className="grid gap-1">
              <label className="text-sm font-medium">Name</label>
              <input
                name="name"
                required
                type="text"
                placeholder="Your name"
                className="rounded-xl border border-slate-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div className="grid gap-1">
              <label className="text-sm font-medium">Email</label>
              <input
                name="email"
                required
                type="email"
                placeholder="your@email.com"
                className="rounded-xl border border-slate-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div className="grid gap-1">
              <label className="text-sm font-medium">Subject</label>
              <input
                name="subject"
                required
                type="text"
                placeholder="How can we help?"
                className="rounded-xl border border-slate-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div className="grid gap-1">
              <label className="text-sm font-medium">Message</label>
              <textarea
                name="message"
                required
                rows={5}
                placeholder="Write your message here..."
                className="rounded-xl border border-slate-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <button
              disabled={loading}
              type="submit"
              className="mt-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {loading ? "Sending..." : "Send message"}
            </button>

            {status === "ok" && (
              <p className="text-sm text-emerald-700">Sent! We’ll reply soon.</p>
            )}
            {status === "err" && (
              <p className="text-sm text-red-700">{errMsg}</p>
            )}

            <p className="text-xs text-slate-500">
              By sending this message, you agree to our Privacy Policy.
            </p>
          </form>

        </div>
      </div>
    </section>
  );
}

