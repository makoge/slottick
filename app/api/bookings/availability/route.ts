import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * Convert a YYYY-MM-DD business-local day into a UTC range
 */
function businessDayToUtcRange(date: string, timezone: string) {
  // Start of day in business timezone
  const startLocal = new Date(`${date}T00:00:00`);
  const endLocal = new Date(`${date}T23:59:59`);

  // Convert local → UTC using Intl
  const startUTC = new Date(
    new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    }).format(startLocal)
  );

  const endUTC = new Date(
    new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    }).format(endLocal)
  );

  return { startUTC, endUTC };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const businessSlug = searchParams.get("businessSlug");
  const date = searchParams.get("date"); // YYYY-MM-DD

  if (!businessSlug || !date) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  const business = await prisma.business.findUnique({
    where: { slug: businessSlug },
    include: { availabilityRule: true }
  });

  if (!business || !business.availabilityRule) {
    return NextResponse.json({ bookings: [] });
  }

  const timezone = business.availabilityRule.timezone;
  const { startUTC, endUTC } = businessDayToUtcRange(date, timezone);

  const bookings = await prisma.booking.findMany({
    where: {
      businessId: business.id,
      status: "CONFIRMED",
      startsAt: {
        gte: startUTC,
        lte: endUTC
      }
    },
    select: {
      startsAt: true,
      durationMin: true
    },
    orderBy: { startsAt: "asc" }
  });

  return NextResponse.json({
    bookings: bookings.map((b) => ({
      startsAt: b.startsAt.toISOString(),
      durationMin: b.durationMin
    }))
  });
}

