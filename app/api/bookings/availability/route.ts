import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Accepts: /api/bookings/availability?businessSlug=xxx&date=YYYY-MM-DD
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const businessSlug = String(searchParams.get("businessSlug") ?? "").trim();
  const date = String(searchParams.get("date") ?? "").trim(); // YYYY-MM-DD

  if (!businessSlug || !date) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  // Basic date validation (avoid weird inputs)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const business = await prisma.business.findUnique({
    where: { slug: businessSlug },
    select: { id: true }
  });

  if (!business) {
    // Don't reveal too much; client can treat as "no bookings"
    return NextResponse.json({ bookings: [] });
  }

  // Treat the requested date as a UTC day window (matches your booking creation assumption)
  const start = new Date(`${date}T00:00:00.000Z`);
  const end = new Date(`${date}T00:00:00.000Z`);
  end.setUTCDate(end.getUTCDate() + 1);

  const bookings = await prisma.booking.findMany({
    where: {
      businessId: business.id,
      status: "CONFIRMED",
      startsAt: { gte: start, lt: end }
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
