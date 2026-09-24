import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Convert business-local date boundary to a UTC Date instant
function utcInstantForBusinessLocal(
  date: string,
  time: string,
  timeZone: string,
) {
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
    hour12: false,
  }).formatToParts(approxUTC);

  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";

  const asIfUTC = Date.UTC(
    Number(get("year")),
    Number(get("month")) - 1,
    Number(get("day")),
    Number(get("hour")),
    Number(get("minute")),
    Number(get("second")),
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

// Accepts: /api/bookings/availability?businessSlug=xxx&date=YYYY-MM-DD&staffId=yyy
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const businessSlug = String(searchParams.get("businessSlug") ?? "").trim();
  const date = String(searchParams.get("date") ?? "").trim(); // YYYY-MM-DD
  const staffId = String(searchParams.get("staffId") ?? "").trim() || null;

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
      availabilityRules: {
        select: {
          timezone: true,
          staffId: true,
          daysJson: true,
          start: true,
          end: true,
          breakStart: true,
          breakEnd: true,
          slotStepMin: true,
        },
      },
      staff: {
        where: { isActive: true },
        select: { id: true },
      },
    },
  });

  if (!business) return NextResponse.json({ bookings: [], busyRanges: [] });

  const rules = business.availabilityRules || [];
  const matchedRule =
    rules.find((r) => r.staffId === staffId) ||
    rules.find((r) => !r.staffId) ||
    rules[0];

  const tz = matchedRule?.timezone || "UTC";

  // Business-local day window -> UTC instants
  const startOfDay = utcInstantForBusinessLocal(date, "00:00", tz);
  const endOfDay = utcInstantForBusinessLocal(addOneDay(date), "00:00", tz);

  // 1. Fetch active bookings (Confirmed + Pending approval hold slots)
  const bookings = await prisma.booking.findMany({
    where: {
      businessId: business.id,
      status: { in: ["CONFIRMED", "PENDING"] },
      ...(staffId ? { staffId } : {}),
      startsAt: { lt: endOfDay },
      endsAt: { gt: startOfDay },
    },
    select: {
      id: true,
      staffId: true,
      startsAt: true,
      endsAt: true,
      durationMin: true,
    },
    orderBy: { startsAt: "asc" },
  });

  // 2. Fetch staff time-off blocks for the target day
  const timeOffBlocks = await prisma.staffTimeOff.findMany({
    where: {
      businessId: business.id,
      ...(staffId ? { staffId } : {}),
      startsAt: { lt: endOfDay },
      endsAt: { gt: startOfDay },
    },
    select: {
      id: true,
      staffId: true,
      startsAt: true,
      endsAt: true,
    },
  });

  // 3. Fetch active concurrency holds that haven't expired
  const now = new Date();
  const activeHolds = await prisma.slotHold.findMany({
    where: {
      businessId: business.id,
      expiresAt: { gt: now },
      ...(staffId ? { staffId } : {}),
      startsAt: { lt: endOfDay },
      endsAt: { gt: startOfDay },
    },
    select: {
      id: true,
      staffId: true,
      startsAt: true,
      endsAt: true,
    },
  });

  // Combine into unified busy ranges
  const busyRanges = [
    ...bookings.map((b) => ({
      type: "booking" as const,
      staffId: b.staffId,
      startsAt: b.startsAt.toISOString(),
      endsAt: b.endsAt.toISOString(),
      durationMin: b.durationMin,
    })),
    ...timeOffBlocks.map((t) => ({
      type: "timeOff" as const,
      staffId: t.staffId,
      startsAt: t.startsAt.toISOString(),
      endsAt: t.endsAt.toISOString(),
      durationMin: Math.round(
        (t.endsAt.getTime() - t.startsAt.getTime()) / 60000,
      ),
    })),
    ...activeHolds.map((h) => ({
      type: "hold" as const,
      staffId: h.staffId,
      startsAt: h.startsAt.toISOString(),
      endsAt: h.endsAt.toISOString(),
      durationMin: Math.round(
        (h.endsAt.getTime() - h.startsAt.getTime()) / 60000,
      ),
    })),
  ];

  return NextResponse.json({
    timezone: tz,
    activeStaffCount: business.staff.length,
    rule: matchedRule
      ? {
          start: matchedRule.start,
          end: matchedRule.end,
          breakStart: matchedRule.breakStart,
          breakEnd: matchedRule.breakEnd,
          slotStepMin: matchedRule.slotStepMin,
        }
      : null,
    bookings: bookings.map((b) => ({
      startsAt: b.startsAt.toISOString(),
      endsAt: b.endsAt.toISOString(),
      durationMin: b.durationMin,
      staffId: b.staffId,
    })),
    busyRanges,
  });
}
