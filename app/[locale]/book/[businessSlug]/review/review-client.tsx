"use client";

import { useState } from "react";
import Link from "next/link";
import { useMessages } from "@/lib/use-messages";
import { t } from "@/lib/i18n";

export default function ReviewClient({
  locale,
  businessSlug,
  token,
}: {
  locale: string;
  businessSlug: string;
  token: string;
}) {
  const messages = useMessages(locale);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!token) {
      setError("Missing review authentication token");
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
    <main className="min-h-screen bg-[#FAF7F2] text-[#241F1A] font-sans selection:bg-[#EAE0D0] selection:text-[#1F1914] px-4 py-12 sm:px-6">
      {/* Top Ledger Ribbon */}
      <div className="mx-auto max-w-lg text-center mb-8">
        <div className="font-mono text-[11px] uppercase tracking-widest text-[#7D7060]">
          ✦ PATRON FEEDBACK & TESTIMONIAL REGISTER ✦
        </div>
      </div>

      {/* Main Vintage Review Card */}
      <div className="relative mx-auto w-full max-w-lg overflow-hidden rounded-2xl border border-[#D5C9B8] bg-white shadow-[0_20px_60px_-25px_rgba(40,32,24,0.15)]">
        {/* Ticket Header Banner */}
        <div className="border-b border-[#E8DFC0] bg-[#1E1915] p-6 sm:p-8 text-[#FAF6F0]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#4F4439] bg-[#2A231E] px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-[#D9CDBB]">
                <span className="h-2 w-2 rounded-full bg-[#C29B38]" />
                Verified Patron
              </div>

              <h1 className="mt-3 font-serif text-3xl font-medium tracking-tight text-[#FAF6F0]">
                Leave a Review
              </h1>
              <p className="mt-1 text-xs text-[#BFB2A2] sm:text-sm font-light">
                Share your atelier appointment experience with the community.
              </p>
            </div>

            <Link
              href={`/${locale}/explore`}
              className="shrink-0 rounded-lg border border-[#44382E] bg-[#2A221C] px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-[#DCD1BF] hover:bg-[#382E25] transition"
            >
              Explore ↗
            </Link>
          </div>
        </div>

        {/* Perforated Divider Strip */}
        <div className="relative flex items-center justify-between border-y border-dashed border-[#DFD5C4] bg-[#F7F2E9] px-4 py-2">
          <div className="font-mono text-[10px] uppercase tracking-widest text-[#7C6E5E]">
            AUTHENTIC TESTIMONIAL LEDGER
          </div>
          <div className="font-mono text-[10px] text-[#A39483]">
            SECURE TOKEN VERIFIED
          </div>
        </div>

        {/* Card Body */}
        <div className="p-6 sm:p-8 bg-white">
          {done ? (
            <div className="py-8 text-center space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#D5C9B8] bg-[#F5EFE6] font-serif text-2xl text-[#8C6D2B]">
                ✓
              </div>

              <h2 className="font-serif text-2xl font-bold text-[#241F1A]">
                Thank You, Patron
              </h2>
              <p className="mx-auto max-w-sm text-xs sm:text-sm text-[#6D5F50] leading-relaxed">
                Your evaluation has been recorded and appended to the
                specialist’s verified client ledger.
              </p>

              <div className="pt-4">
                <Link
                  href={`/${locale}/explore`}
                  className="inline-flex items-center justify-center rounded-xl bg-[#241F1A] px-6 py-3 font-mono text-xs font-bold uppercase tracking-wider text-[#FAF6F0] shadow-sm hover:bg-[#3D332B] transition active:scale-95"
                >
                  Return to Explore →
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {error && (
                <div className="rounded-lg border border-red-300 bg-red-50/90 p-3.5 font-mono text-xs font-semibold text-red-800">
                  ✕ {error}
                </div>
              )}

              {/* Star Rating Selector */}
              <div className="space-y-2">
                <label className="font-mono text-xs uppercase tracking-wider text-[#635547]">
                  Rating Grade
                </label>

                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`flex h-11 w-11 items-center justify-center rounded-xl border font-serif text-xl transition-all active:scale-90 ${
                        rating >= star
                          ? "border-[#8C6D2B] bg-[#FAF3E3] text-[#8C6D2B] shadow-2xs"
                          : "border-[#DCD0C0] bg-[#FCFBF8] text-[#D0C4B4] hover:border-[#8C6D2B]"
                      }`}
                    >
                      ★
                    </button>
                  ))}
                  <span className="ml-2 font-mono text-xs font-bold text-[#3B3229]">
                    {rating} of 5 Stars
                  </span>
                </div>
              </div>

              {/* Comment Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-mono text-xs uppercase tracking-wider text-[#635547]">
                    Written Testimonial
                  </label>
                  <span className="font-mono text-[10px] text-[#9A8D7E]">
                    Optional
                  </span>
                </div>

                <textarea
                  className="min-h-[130px] w-full resize-y rounded-xl border border-[#D5CABB] bg-[#FAF8F5] p-3.5 font-sans text-sm text-[#261F1A] placeholder:text-[#9A8E80] focus:border-[#261F1A] focus:bg-white focus:outline-none"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Describe the precision of the service, environment, and craftsman expertise..."
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={submit}
                  className="w-full rounded-xl bg-[#221B16] py-4 font-mono text-xs font-bold uppercase tracking-widest text-[#FAF6F0] shadow-lg transition hover:bg-[#3B3028] active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? "Inscribing Review..." : "✦ Post Testimonial ✦"}
                </button>
              </div>

              <p className="text-center font-mono text-[11px] text-[#8A7C6D]">
                Only authenticated patrons with verified booking hashes may
                submit entries.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
