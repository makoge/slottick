import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthedBusiness } from "@/lib/auth";
import { sendClientFollowUpEmail } from "@/lib/email";

export const runtime = "nodejs";

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
    const business = await getAuthedBusiness();
    if (!business) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Missing booking id" }, { status: 400 });
    }

    const url = new URL(req.url);
    const locale = url.searchParams.get("locale")?.trim() || "en";

    const booking = await prisma.booking.findFirst({
      where: { id, businessId: business.id },
      select: {
        id: true,
        status: true,
        startsAt: true,
        serviceName: true,
        customerEmail: true,
        customerName: true,
        business: {
          select: {
            name: true,
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
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (booking.status === "CANCELLED") {
      return NextResponse.json({ ok: true });
    }

    await prisma.booking.update({
      where: { id },
      data: { status: "CANCELLED" },
    });

    // ✅ Send cancellation email
    if (booking.customerEmail) {
      const siteUrl =
        process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://slottick.com";

      const timeZone = booking.business.availabilityRule?.timezone || "UTC";
      const { date, time } = formatBookingDateParts(booking.startsAt, timeZone);

      try {
        await sendClientFollowUpEmail({
          to: booking.customerEmail,
          subject: `Booking cancelled: ${booking.serviceName}`,
          html: `
            <p>Hello ${booking.customerName},</p>

            <p>Your appointment has been cancelled.</p>

            <p>
              <strong>Business:</strong> ${booking.business.name}<br/>
              <strong>Service:</strong> ${booking.serviceName}<br/>
              <strong>Date:</strong> ${date}<br/>
              <strong>Time:</strong> ${time}
            </p>

            <p>If this was a mistake, you can rebook here:</p>

            <p>
              <a href="${siteUrl}/${locale}/book/${business.slug}">
                Book again
              </a>
            </p>
          `,
        });
      } catch (err) {
        console.error("Cancel email failed:", err);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST /api/bookings/[id]/cancel failed:", err);
    return NextResponse.json(
      { error: "Failed to cancel booking." },
      { status: 500 }
    );
  }
}