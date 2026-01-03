import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import crypto from "crypto";

function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));

  const bookingId = String(body.bookingId ?? "").trim();
  const rating = Number(body.rating ?? 0);
  const comment =
    body.comment && String(body.comment).trim()
      ? String(body.comment).trim()
      : undefined;

  // Optional: token sent by email (recommended)
  const reviewToken = body.reviewToken ? String(body.reviewToken).trim() : null;

  if (!bookingId || !Number.isFinite(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { business: true }
  });

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  if (booking.status === "CANCELLED") {
    return NextResponse.json({ error: "Booking was cancelled" }, { status: 400 });
  }

  // Must be completed: now > end time
  const endsAt = new Date(
    booking.startsAt.getTime() + booking.durationMin * 60_000
  );

  if (Date.now() < endsAt.getTime()) {
    return NextResponse.json(
      { error: "You can review only after the appointment is completed." },
      { status: 403 }
    );
  }

  // If you're using email review links, enforce token
  // You need to store reviewTokenHash on Booking (recommended)
  // booking.reviewTokenHash String?  (add to schema if not there yet)
  if (booking.reviewTokenHash) {
    if (!reviewToken) {
      return NextResponse.json(
        { error: "Missing review token" },
        { status: 401 }
      );
    }
    const hash = sha256(reviewToken);
    if (hash !== booking.reviewTokenHash) {
      return NextResponse.json(
        { error: "Invalid review token" },
        { status: 401 }
      );
    }
  }

  const existing = await prisma.review.findUnique({ where: { bookingId } });
  if (existing) {
    return NextResponse.json({ error: "Already reviewed" }, { status: 409 });
  }

  const review = await prisma.review.create({
    data: {
      bookingId,
      businessId: booking.businessId,
      rating,
      comment
    }
  });

  // Optional: unlock marketplace listing after first real review
  if (!booking.business.marketplaceEligibleAt) {
    await prisma.business.update({
      where: { id: booking.businessId },
      data: { marketplaceEligibleAt: new Date() }
    });
  }

  return NextResponse.json({ review });
}

