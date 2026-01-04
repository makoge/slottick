import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendBookingConfirmationEmail } from "@/lib/email";
import {
  defaultAvailability,
  slotRangeForService,
  type AvailabilityRule
} from "@/lib/availability";

function money(price: number, currency: string) {
  const symbols: Record<string, string> = { EUR: "€", USD: "$", FCFA: "FCFA" };
  const s = symbols[currency] ?? currency;
  return currency === "FCFA" ? `${price} ${s}` : `${s}${price}`;
}

function safeParseDays(daysJson: string | null | undefined) {
  try {
    const days = JSON.parse(daysJson ?? "[]");
    return Array.isArray(days) ? days : [];
  } catch {
    return [];
  }
}

function toDate(d: unknown) {
  const x = typeof d === "string" ? new Date(d) : new Date("");
  return Number.isFinite(x.getTime()) ? x : null;
}

// for MVP we assume startsAt is UTC (you create it as ...Z on client)
function dayWindowUTC(startsAt: Date) {
  const y = startsAt.getUTCFullYear();
  const m = startsAt.getUTCMonth();
  const d = startsAt.getUTCDate();
  const start = new Date(Date.UTC(y, m, d, 0, 0, 0));
  const end = new Date(Date.UTC(y, m, d + 1, 0, 0, 0));
  return { start, end };
}

function hhmmUTC(dt: Date) {
  const h = String(dt.getUTCHours()).padStart(2, "0");
  const m = String(dt.getUTCMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

function getLocaleFromReferer(req: Request) {
  const ref = req.headers.get("referer");
  if (!ref) return "en";
  try {
    const { pathname } = new URL(ref);
    const seg = pathname.split("/").filter(Boolean)[0];
    return seg || "en";
  } catch {
    return "en";
  }
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));

  const businessSlug = String(body.businessSlug ?? "").trim();
  const serviceName = String(body.serviceName ?? "").trim();
  const durationMin = Number(body.durationMin ?? 0);
  const price = Number(body.price ?? 0);
  const currency = String(body.currency ?? "EUR").trim();

  const startsAt = toDate(body.startsAt);

  const customerName = String(body.customerName ?? "").trim();
  const customerPhone = String(body.customerPhone ?? "").trim();
  const customerEmail = body.customerEmail
    ? String(body.customerEmail).trim().toLowerCase()
    : null;
  const notes = body.notes ? String(body.notes).trim() : null;

  if (!businessSlug || !serviceName || !customerName || !customerPhone || !startsAt) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  if (!Number.isFinite(durationMin) || durationMin <= 0) {
    return NextResponse.json({ error: "Invalid duration" }, { status: 400 });
  }

  const business = await prisma.business.findUnique({
    where: { slug: businessSlug },
    include: { availabilityRule: true }
  });

  if (!business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  // Build availability rule from DB (fallback to defaults)
  const ar = business.availabilityRule;
  const rule: AvailabilityRule = {
    ...defaultAvailability,
    timezone: ar?.timezone ?? defaultAvailability.timezone,
    days: (ar ? safeParseDays(ar.daysJson) : defaultAvailability.days) as any,
    start: ar?.start ?? defaultAvailability.start,
    end: ar?.end ?? defaultAvailability.end,
    breakStart: ar?.breakStart ?? defaultAvailability.breakStart,
    breakEnd: ar?.breakEnd ?? defaultAvailability.breakEnd,
    bufferMin: ar?.bufferMin ?? defaultAvailability.bufferMin,
    slotStepMin: ar?.slotStepMin ?? defaultAvailability.slotStepMin
  };

  // collision check (DB truth)
  const { start, end } = dayWindowUTC(startsAt);

  const sameDayBookings = await prisma.booking.findMany({
    where: {
      businessId: business.id,
      status: "CONFIRMED",
      startsAt: { gte: start, lt: end }
    },
    select: { startsAt: true, durationMin: true }
  });

  const requestedTime = hhmmUTC(startsAt);
  const neededSlots = slotRangeForService(requestedTime, rule, durationMin);

  for (const b of sameDayBookings) {
    const bTime = hhmmUTC(b.startsAt);
    const blocked = slotRangeForService(bTime, rule, b.durationMin);
    const blockedSet = new Set(blocked);
    if (neededSlots.some((x) => blockedSet.has(x))) {
      return NextResponse.json({ error: "This slot was just booked" }, { status: 409 });
    }
  }

  // Create booking (unique constraint: @@unique([businessId, startsAt]))
  let booking;
  try {
    booking = await prisma.booking.create({
      data: {
        businessId: business.id,
        serviceName,
        durationMin,
        price,
        currency,
        startsAt,
        customerName,
        customerPhone,
        customerEmail: customerEmail || undefined,
        notes: notes || undefined
      }
    });
  } catch {
    return NextResponse.json(
      { error: "That slot is already booked. Choose another time." },
      { status: 409 }
    );
  }

  // Email (optional) — never fail booking because of email
  if (customerEmail) {
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ??
      process.env.NEXT_PUBLIC_APP_URL ??
      "http://localhost:3000";

    const locale = getLocaleFromReferer(req);

    const manageLink = `${baseUrl}/${locale}/book/${business.slug}/success?id=${encodeURIComponent(
      booking.id
    )}`;

    try {
      await sendBookingConfirmationEmail({
        to: customerEmail,
        businessName: business.name,
        serviceName,
        date: startsAt.toISOString().slice(0, 10),
        time: requestedTime,
        durationMin,
        priceText: money(price, currency),
        manageLink
      });
    } catch (e) {
      console.error("[booking] confirmation email failed", e);
    }
  }

  return NextResponse.json({ booking });
}
