import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Convert business-local date boundary to a UTC Date instant
function utcInstantForBusinessLocal(date: string, time: string, timeZone: string) {
  const [y, mo, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);

  const approxUTC = new Date(Date.UTC(y, mo - 1, d, hh, mm, 0));

  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).formatToParts(approxUTC);

  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";

  const asIfUTC = Date.UTC(
    Number(get("year")),
    Number(get("month")) - 1,
    Number(get("day")),
    Number(get("hour")),
    Number(get("minute")),
    Number(get("second"))
  );

  const offsetMs = asIfUTC - approxUTC.getTime();
  return new Date(approxUTC.getTime() - offsetMs);
}

// YYYY-MM-DD + 1 day (string)
function addOneDay(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + 1);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

// Accepts: /api/bookings/availability?businessSlug=xxx&date=YYYY-MM-DD
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const businessSlug = String(searchParams.get("businessSlug") ?? "").trim();
  const date = String(searchParams.get("date") ?? "").trim(); // YYYY-MM-DD

  if (!businessSlug || !date) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const business = await prisma.business.findUnique({
    where: { slug: businessSlug },
    select: {
      id: true,
      availabilityRule: { select: { timezone: true } }
    }
  });

  if (!business) return NextResponse.json({ bookings: [] });

  const tz = business.availabilityRule?.timezone || "UTC";

  // ✅ Business-local day window -> UTC instants
  const start = utcInstantForBusinessLocal(date, "00:00", tz);
  const end = utcInstantForBusinessLocal(addOneDay(date), "00:00", tz);

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
