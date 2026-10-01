// app/[locale]/book/[slug]/opengraph-image.tsx
import { ImageResponse } from "next/og";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const alt = "Slottick Review";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; businessSlug: string }>;
  searchParams: Promise<{ reviewId?: string; service?: string }>;
}) {
  const { businessSlug } = await params;
  const sp = await searchParams;
  const reviewId = sp?.reviewId;

  const business = await prisma.business.findUnique({
    where: { slug: decodeURIComponent(businessSlug) },
    select: {
      name: true,
      city: true,
      country: true,
      ratingAvg: true,
      ratingCount: true,
      logoUrl: true,
      galleryImages: { take: 1, select: { url: true } },
    },
  });

  const name = business?.name || "Book Appointment";
  const city = business?.city || "";
  const heroImage =
    business?.galleryImages?.[0]?.url || business?.logoUrl || null;

  // Check if this card represents a specific review
  let reviewData: {
    rating: number;
    comment: string | null;
    author: string;
  } | null = null;

  if (reviewId) {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      select: {
        bookingId: true,
        rating: true,
        comment: true,
      },
    });

    if (review) {
      const booking = await prisma.booking.findUnique({
        where: { id: review.bookingId },
        select: { customerName: true },
      });

      reviewData = {
        rating: review.rating,
        comment: review.comment,
        author: booking?.customerName || "Verified Client",
      };
    }
  }

  // --- REVIEW CARD VARIANT ---
  if (reviewData) {
    return new ImageResponse(
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#090d16",
          color: "#ffffff",
          fontFamily: "sans-serif",
          padding: "56px",
          boxSizing: "border-box",
          position: "relative",
        }}
      >
        {/* Top Row: Business Brand + Verification */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                backgroundColor: "#d9f99d",
                color: "#14532d",
                padding: "6px 16px",
                borderRadius: "999px",
                fontSize: "15px",
                fontWeight: "bold",
              }}
            >
              ★ Verified Client Review
            </div>
            <span style={{ fontSize: "20px", color: "#94a3b8" }}>
              on Slottick
            </span>
          </div>

          <div
            style={{ fontSize: "22px", fontWeight: "bold", color: "#e2e8f0" }}
          >
            {name} {city ? `• ${city}` : ""}
          </div>
        </div>

        {/* Middle: Star Rating & Testimonial Quote */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            maxWidth: "980px",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "8px",
              fontSize: "36px",
              color: "#facc15",
            }}
          >
            {"★".repeat(reviewData.rating)}
          </div>

          <div
            style={{
              fontSize:
                reviewData.comment && reviewData.comment.length > 120
                  ? "38px"
                  : "48px",
              fontWeight: 800,
              lineHeight: 1.25,
              color: "#f8fafc",
              letterSpacing: "-0.02em",
            }}
          >
            “
            {reviewData.comment ||
              "Outstanding experience and top-tier service!"}
            ”
          </div>

          <div
            style={{ fontSize: "20px", color: "#a3e635", fontWeight: "bold" }}
          >
            — {reviewData.author}
          </div>
        </div>

        {/* Bottom Bar: Call to Action */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: "1px solid rgba(255,255,255,0.15)",
            paddingTop: "24px",
          }}
        >
          <div style={{ fontSize: "18px", color: "#94a3b8" }}>
            Book your slot with {name}
          </div>
          <div
            style={{
              backgroundColor: "#ffffff",
              color: "#0f172a",
              padding: "12px 24px",
              borderRadius: "14px",
              fontSize: "16px",
              fontWeight: "bold",
            }}
          >
            Book Now →
          </div>
        </div>
      </div>,
      { ...size },
    );
  }

  // --- DEFAULT BUSINESS CARD VARIANT ---
  return new ImageResponse(
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "row",
        backgroundColor: "#090d16",
        color: "#ffffff",
        fontFamily: "sans-serif",
        padding: "48px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "60%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div
            style={{
              backgroundColor: "#d9f99d",
              color: "#14532d",
              padding: "8px 16px",
              borderRadius: "999px",
              fontSize: "14px",
              fontWeight: "bold",
              display: "inline-flex",
            }}
          >
            ✓ Verified on Slottick
          </div>
          <h1
            style={{
              fontSize: "52px",
              fontWeight: 900,
              marginTop: "24px",
              lineHeight: 1.1,
            }}
          >
            {name}
          </h1>
          <p style={{ fontSize: "22px", color: "#94a3b8" }}>📍 {city}</p>
        </div>
        <div
          style={{
            backgroundColor: "#ffffff",
            color: "#0f172a",
            padding: "14px 28px",
            borderRadius: "16px",
            fontSize: "18px",
            fontWeight: "bold",
            display: "inline-flex",
            width: "fit-content",
          }}
        >
          Book Online Instantly →
        </div>
      </div>

      <div
        style={{
          width: "40%",
          height: "100%",
          borderRadius: "24px",
          overflow: "hidden",
          border: "2px solid rgba(255,255,255,0.1)",
        }}
      >
        {heroImage ? (
          <img
            src={heroImage}
            alt={name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#1e293b",
              fontSize: "96px",
              fontWeight: 900,
              color: "#64748b",
            }}
          >
            {name.charAt(0)}
          </div>
        )}
      </div>
    </div>,
    { ...size },
  );
}
