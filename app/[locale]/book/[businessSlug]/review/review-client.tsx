"use client";

import { useState } from "react";

export default function ReviewClient({
  locale,
  businessSlug,
  token,
}: {
  locale: string;
  businessSlug: string;
  token: string;
}) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!token) {
      setError("Missing review token");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, rating, comment, businessSlug }),
      });

      const j = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(j.error || "Failed to submit review");
        return;
      }

      setDone(true);
    } catch {
      setError("Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-xl px-6 py-14">
        <section className="rounded-3xl border border-slate-200 p-8 shadow-sm bg-lime-100">
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
              {error ? (
                <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

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
                disabled={submitting}
                onClick={submit}
                className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {submitting ? "Submitting..." : "Submit review"}
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
