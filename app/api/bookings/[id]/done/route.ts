import crypto from "crypto";
import { NextResponse } from "next/server";
import { getAuthedBusiness } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendReviewRequestEmail } from "@/lib/email";

export const runtime = "nodejs";

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function formatBookingDateParts(startsAt: Date | string, timeZone: string) {
  const dt = new Date(startsAt);

  const date = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(dt);

  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(dt);

  return { date, time };
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const business = await getAuthedBusiness();
    if (!business) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const locale = url.searchParams.get("locale")?.trim() || "en";

    const booking = await prisma.booking.findFirst({
      where: {
        id,
        businessId: business.id,
      },
      select: {
        id: true,
        status: true,
        startsAt: true,
        serviceName: true,
        customerEmail: true,
        business: {
          select: {
            name: true,
            slug: true,
            availabilityRule: {
              select: {
                timezone: true,
              },
            },
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const reviewTokenHash = hashToken(rawToken);

    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: "DONE",
        reviewTokenHash,
        reviewEmailSentAt: new Date(),
      },
    });

    if (booking.customerEmail) {
      const siteUrl =
        process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://slottick.com";

      const timeZone = booking.business.availabilityRule?.timezone || "UTC";
      const { date, time } = formatBookingDateParts(booking.startsAt, timeZone);

      const reviewLink = `${siteUrl}/${locale}/book/${booking.business.slug}/review?token=${encodeURIComponent(rawToken)}`;

      try {
        await sendReviewRequestEmail({
          to: booking.customerEmail,
          businessName: booking.business.name,
          serviceName: booking.serviceName,
          date,
          time,
          reviewLink,
        });
      } catch (emailErr) {
        console.error("Review email send failed:", emailErr);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST /api/bookings/[id]/done failed:", err);
    return NextResponse.json(
      { error: "Failed to mark booking as done." },
      { status: 500 }
    );
  }
}

