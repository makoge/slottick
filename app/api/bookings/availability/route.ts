import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function dayWindowUTC(isoDate: string) {
  // isoDate = "YYYY-MM-DD"
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!m) return null;

  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);

  const start = new Date(Date.UTC(y, mo, d, 0, 0, 0));
  const end = new Date(Date.UTC(y, mo, d + 1, 0, 0, 0));
  return { start, end };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const businessSlug = String(searchParams.get("businessSlug") ?? "").trim();
  const date = String(searchParams.get("date") ?? "").trim(); // YYYY-MM-DD

  if (!businessSlug || !date) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  const win = dayWindowUTC(date);
  if (!win) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const business = await prisma.business.findUnique({
    where: { slug: businessSlug },
    select: { id: true }
  });

  if (!business) {
    return NextResponse.json({ bookings: [] });
  }

  const bookings = await prisma.booking.findMany({
    where: {
      businessId: business.id,
      status: "CONFIRMED",
      startsAt: { gte: win.start, lt: win.end }
    },
    select: { startsAt: true, durationMin: true },
    orderBy: { startsAt: "asc" }
  });

  return NextResponse.json({
    bookings: bookings.map((b) => ({
      startsAt: b.startsAt.toISOString(),
      durationMin: b.durationMin
    }))
  });
}
