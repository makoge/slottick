"use client";

import { useState } from "react";
import Link from "next/link";

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
    <div className="relative flex min-h-[calc(100vh-4rem)] w-full items-center justify-center px-4 py-12 sm:px-6">
      {/* Ambient background glow accents */}
      <div className="pointer-events-none absolute -top-12 h-64 w-64 rounded-full bg-lime-200/40 blur-3xl sm:h-80 sm:w-80" />
      <div className="pointer-events-none absolute -bottom-12 h-64 w-64 rounded-full bg-slate-400/30 blur-3xl sm:h-80 sm:w-80" />

      {/* Main Glassmorphic Container Card */}
      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-3xl border border-slate-400/40 bg-white/75 p-6 shadow-xl backdrop-blur-2xl sm:p-10">
        {/* Slottick Identity Pill */}
        <div className="flex items-center justify-between border-b border-slate-300/70 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-lime-300/80 bg-lime-100 px-3.5 py-1 text-xs font-bold text-lime-950 shadow-xs">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-lime-900 text-[10px] text-white">
                ✓
              </span>
              <span className="font-mono uppercase tracking-wider">
                Client Verification
              </span>
            </div>

            <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              Leave a review
            </h1>
            <p className="mt-1 text-xs text-slate-600 sm:text-sm">
              Share your appointment experience with the community.
            </p>
          </div>

          <Link
            href={`/${locale}/explore`}
            className="rounded-xl border border-slate-300/80 bg-white/80 px-3 py-1.5 font-mono text-xs font-semibold text-slate-600 shadow-2xs backdrop-blur-sm transition-all hover:bg-white hover:text-slate-950"
          >
            Explore
          </Link>
        </div>

        {done ? (
          <div className="py-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-lime-300/80 bg-lime-100 text-2xl font-bold text-lime-950 shadow-xs">
              ✓
            </div>

            <h2 className="mt-4 text-xl font-bold text-slate-900">
              Thank you!
            </h2>
            <p className="mx-auto mt-2 max-w-sm text-sm text-slate-600">
              Your feedback has been verified and added to the provider’s public
              profile.
            </p>

            <div className="mt-6">
              <Link
                href={`/${locale}/explore`}
                className="inline-flex items-center justify-center rounded-2xl border border-lime-300/80 bg-lime-100 px-6 py-3 font-mono text-xs font-bold uppercase tracking-wider text-lime-950 shadow-xs transition hover:bg-lime-200 active:scale-95"
              >
                Back to explore →
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-6 space-y-5">
            {error && (
              <div className="rounded-2xl border border-rose-300/80 bg-rose-50/90 p-3.5 font-mono text-xs font-bold text-rose-800 shadow-2xs backdrop-blur-sm">
                ✕ {error}
              </div>
            )}

            {/* Interactive Rating Picker */}
            <div className="space-y-2">
              <label className="font-mono text-xs font-bold uppercase tracking-wider text-slate-700">
                Rating
              </label>

              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className={`flex h-11 w-11 items-center justify-center rounded-2xl border font-mono text-lg transition-all active:scale-90 ${
                      rating >= star
                        ? "border-lime-300/90 bg-lime-100 text-lime-950 shadow-xs"
                        : "border-slate-300/80 bg-white/80 text-slate-400 hover:bg-white"
                    }`}
                  >
                    ★
                  </button>
                ))}
                <span className="ml-2 font-mono text-xs font-bold text-slate-700">
                  {rating} of 5 stars
                </span>
              </div>
            </div>

            {/* Comment Area */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-mono text-xs font-bold uppercase tracking-wider text-slate-700">
                  Comment
                </label>
                <span className="font-mono text-[11px] text-slate-400">
                  Optional
                </span>
              </div>
              <textarea
                className="min-h-[130px] w-full resize-y rounded-2xl border border-slate-300/80 bg-white/90 p-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:bg-white focus:outline-none"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="How was your service, studio environment, and overall experience?"
              />
            </div>

            {/* Submission Button */}
            <div className="pt-2">
              <button
                type="button"
                disabled={submitting}
                onClick={submit}
                className="flex w-full items-center justify-center rounded-2xl border border-lime-300/80 bg-lime-100 px-6 py-3.5 font-mono text-xs font-bold uppercase tracking-wider text-lime-950 shadow-xs transition hover:bg-lime-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? "Submitting Review..." : "Submit Review →"}
              </button>
            </div>

            <p className="text-center font-mono text-[11px] text-slate-500">
              Only verified customers with a valid appointment token can submit
              reviews.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
