"use client";

import { useState } from "react";

export default function ReviewClient({
  locale,
  businessSlug,
  bookingId
}: {
  locale: string;
  businessSlug: string;
  bookingId: string;
}) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [done, setDone] = useState(false);

  async function submit() {
    if (!bookingId) return alert("Missing bookingId");
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId, rating, comment })
    });

    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      return alert(j.error || "Failed to submit review");
    }
    setDone(true);
  }

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-xl px-6 py-14">
        <section className="rounded-3xl border border-slate-200 p-8 shadow-sm">
          <h1 className="text-2xl font-bold tracking-tight">Leave a review</h1>

          {done ? (
            <>
              <p className="mt-3 text-slate-600">Thanks — your review was submitted ✅</p>
              <a className="mt-6 inline-block underline" href={`/${locale}/explore`}>
                Back to explore
              </a>
            </>
          ) : (
            <div className="mt-6 grid gap-4">
              <label className="grid gap-1 text-sm">
                Rating
                <select
                  className="rounded-xl border border-slate-200 px-3 py-2"
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                >
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>
                      {n} star{n === 1 ? "" : "s"}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-1 text-sm">
                Comment (optional)
                <textarea
                  className="min-h-[120px] rounded-xl border border-slate-200 px-3 py-2"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="How was your experience?"
                />
              </label>

              <button
                type="button"
                onClick={submit}
                className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Submit review
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
