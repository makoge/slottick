// components/dashboard/reviews-section.tsx
"use client";

import { useEffect, useState } from "react";
import ReviewShareModal from "./review-share-modal";

type ReviewItem = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  customerName: string;
  serviceName: string;
};

type Props = {
  businessName: string;
  businessSlug: string;
  locale?: string;
};

export default function ReviewsSection({
  businessName,
  businessSlug,
  locale = "en",
}: Props) {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [ratingAvg, setRatingAvg] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sharingReview, setSharingReview] = useState<ReviewItem | null>(null);

  useEffect(() => {
    async function loadReviews() {
      try {
        const res = await fetch("/api/dashboard/reviews");
        if (res.ok) {
          const data = await res.json();
          setReviews(data.reviews || []);
          setRatingAvg(data.ratingAvg || 0);
          setRatingCount(data.ratingCount || 0);
        }
      } catch (err) {
        console.error("Failed to fetch reviews", err);
      } finally {
        setLoading(false);
      }
    }
    loadReviews();
  }, []);

  return (
    <section className="space-y-6">
      {/* Header & Stats Banner */}
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-300/80 bg-white/80 p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg border border-lime-300/80 bg-lime-100 text-xs">
              ⭐
            </span>
            <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-slate-800">
              Client Reviews & Social Proof
            </h2>
          </div>
          <p className="mt-1 font-mono text-xs text-slate-500">
            Ratings collected automatically after appointments are marked DONE.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-center">
            <span className="block font-mono text-2xl font-black text-slate-900">
              {ratingAvg > 0 ? ratingAvg.toFixed(1) : "—"}
            </span>
            <span className="font-mono text-[10px] uppercase text-slate-500">
              Average Rating
            </span>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-center">
            <span className="block font-mono text-2xl font-black text-slate-900">
              {ratingCount}
            </span>
            <span className="font-mono text-[10px] uppercase text-slate-500">
              Total Reviews
            </span>
          </div>
        </div>
      </div>

      {/* Review List */}
      {loading ? (
        <div className="p-8 text-center font-mono text-xs text-slate-400">
          Loading reviews...
        </div>
      ) : reviews.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center font-mono text-xs text-slate-500">
          No reviews yet. When a completed appointment gets reviewed, it will
          appear here.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {reviews.map((r) => (
            <div
              key={r.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex text-amber-400 text-sm">
                      {"★".repeat(r.rating)}
                      <span className="text-slate-200">
                        {"★".repeat(5 - r.rating)}
                      </span>
                    </div>
                    <span className="font-mono text-xs font-bold text-slate-900">
                      {r.customerName}
                    </span>
                    <span className="font-mono text-[11px] text-slate-400">
                      {" • "}
                      {r.serviceName}
                    </span>
                  </div>

                  {/* Share Card Trigger */}
                  <button
                    type="button"
                    onClick={() => setSharingReview(r)}
                    className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-lime-300/80 bg-lime-100 px-2.5 py-1 font-mono text-[11px] font-bold text-lime-950 transition hover:bg-lime-200 active:scale-95"
                  >
                    <span>📢</span>
                    <span>Share Card</span>
                  </button>
                </div>

                <p className="mt-3 text-xs leading-relaxed text-slate-700 italic">
                  {r.comment ? (
                    `“${r.comment}”`
                  ) : (
                    <span className="not-italic text-slate-400">
                      No written feedback provided.
                    </span>
                  )}
                </p>
              </div>

              <div className="mt-4 border-t border-slate-100 pt-2 font-mono text-[10px] text-slate-400">
                {new Date(r.createdAt).toLocaleDateString(locale, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Share Modal Dialog */}
      {sharingReview && (
        <ReviewShareModal
          review={{
            id: sharingReview.id,
            rating: sharingReview.rating,
            comment: sharingReview.comment,
            clientName: sharingReview.customerName,
          }}
          businessName={businessName}
          businessSlug={businessSlug}
          locale={locale}
          onClose={() => setSharingReview(null)}
        />
      )}
    </section>
  );
}
