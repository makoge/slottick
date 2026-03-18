import crypto from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function asString(v: unknown) {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any));

    const token = asString(body.token).trim();
    const businessSlug = asString(body.businessSlug).trim();
    const rating = Number(body.rating);
    const commentRaw = asString(body.comment).trim();
    const comment = commentRaw || null;

    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    if (!businessSlug) {
      return NextResponse.json({ error: "Missing businessSlug" }, { status: 400 });
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
    }

    const reviewTokenHash = hashToken(token);

    const booking = await prisma.booking.findFirst({
      where: {
        reviewTokenHash,
        status: "DONE",
        business: {
          slug: businessSlug,
        },
      },
      select: {
        id: true,
        businessId: true,
        startsAt: true,
        durationMin: true,
        review: {
          select: { id: true },
        },
      },
    });

 

    if (!booking) {
      return NextResponse.json({ error: "Invalid or expired review link" }, { status: 404 });
    }

      const endsAt = new Date(
        new Date(booking.startsAt).getTime() + booking.durationMin * 60_000
        );

  if (Date.now() < endsAt.getTime()) {
  return NextResponse.json(
    { error: "You can review only after the appointment is completed." },
    { status: 403 }
  );
    }

    if (booking.review) {
      return NextResponse.json({ error: "Review already submitted" }, { status: 409 });
    }
   

    await prisma.review.create({
      data: {
        bookingId: booking.id,
        businessId: booking.businessId,
        rating,
        comment,
      },
    });

    const agg = await prisma.review.aggregate({
      where: { businessId: booking.businessId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await prisma.business.update({
      where: { id: booking.businessId },
      data: {
        ratingAvg: agg._avg.rating ?? 0,
        ratingCount: agg._count.rating ?? 0,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST /api/reviews failed:", err);
    return NextResponse.json({ error: "Failed to submit review" }, { status: 500 });
  }
}

