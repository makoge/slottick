import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendBookingConfirmationEmail } from "@/lib/email";
import { getAuthedBusiness } from "@/lib/auth";
import {
  defaultAvailability,
  slotRangeForService,
  type AvailabilityRule
} from "@/lib/availability";
import { ServiceCategory } from "@prisma/client";

export const runtime = "nodejs";

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

// --- Timezone helpers ---

function ymdInTZ(dt: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(dt);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function addOneDay(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + 1);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

// Convert business-local boundary (date + HH:mm) to a UTC instant
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

function hhmmInTZ(dt: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).formatToParts(dt);
  const h = parts.find((p) => p.type === "hour")?.value ?? "00";
  const m = parts.find((p) => p.type === "minute")?.value ?? "00";
  return `${h}:${m}`;
}

// --- Routes ---

export async function GET(req: Request) {
  const url = new URL(req.url);
  const scope = url.searchParams.get("scope");

  if (scope !== "owner") {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const business = await getAuthedBusiness();
  if (!business) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const bookings = await prisma.booking.findMany({
    where: { businessId: business.id },
    orderBy: { startsAt: "desc" },
    select: {
      id: true,
      startsAt: true,
      durationMin: true,
      serviceName: true,
      price: true,
      currency: true,
      customerName: true,
      customerPhone: true,
      customerCountry: true,
      notes: true,
      status: true,
      serviceCategory: true,
      serviceId: true
    }
  });

  return NextResponse.json({
    bookings: bookings.map((b) => ({
      ...b,
      startsAt: b.startsAt.toISOString()
    }))
  });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));

  const businessSlug = String(body.businessSlug ?? "").trim();
  const serviceId = String(body.serviceId ?? "").trim();
  const startsAt = toDate(body.startsAt);

  const customerName = String(body.customerName ?? "").trim();
  const customerPhone = String(body.customerPhone ?? "").trim();
  const customerEmail = body.customerEmail
    ? String(body.customerEmail).trim().toLowerCase()
    : null;
  const customerCountry = body.customerCountry ? String(body.customerCountry).trim() : null;
  const notes = body.notes ? String(body.notes).trim() : null;

  if (!businessSlug || !serviceId || !customerName || !customerPhone || !startsAt) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const business = await prisma.business.findUnique({
    where: { slug: businessSlug },
    include: { availabilityRule: true }
  });

  if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

  // ✅ Source of truth: service row (must belong to business)
  const service = await prisma.service.findFirst({
    where: { id: serviceId, businessId: business.id },
    select: { id: true, name: true, durationMin: true, price: true, currency: true, category: true }
  });

  if (!service) {
    return NextResponse.json({ error: "Service not found" }, { status: 404 });
  }

  const durationMin = service.durationMin;
  if (!Number.isFinite(durationMin) || durationMin <= 0) {
    return NextResponse.json({ error: "Invalid service duration" }, { status: 400 });
  }

  // Availability (same behavior)
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

  const tz = rule.timezone || "UTC";

  // ✅ Business-local day window for collision checks
  const localDate = ymdInTZ(startsAt, tz);
  const start = utcInstantForBusinessLocal(localDate, "00:00", tz);
  const end = utcInstantForBusinessLocal(addOneDay(localDate), "00:00", tz);

  const sameDayBookings = await prisma.booking.findMany({
    where: {
      businessId: business.id,
      status: "CONFIRMED",
      startsAt: { gte: start, lt: end }
    },
    select: { startsAt: true, durationMin: true }
  });

  const requestedTime = hhmmInTZ(startsAt, tz);
  const neededSlots = slotRangeForService(requestedTime, rule, durationMin);

  for (const b of sameDayBookings) {
    const bTime = hhmmInTZ(b.startsAt, tz);
    const blocked = slotRangeForService(bTime, rule, b.durationMin);
    const blockedSet = new Set(blocked);
    if (neededSlots.some((x) => blockedSet.has(x))) {
      return NextResponse.json({ error: "This slot was just booked" }, { status: 409 });
    }
  }

  // ✅ Persist booking (serviceCategory is enum-safe)
  let booking;
  try {
    booking = await prisma.booking.create({
      data: {
        businessId: business.id,

        serviceId: service.id,
        serviceCategory: service.category as ServiceCategory, // ✅ enum

        // snapshots for history/emails
        serviceName: service.name,
        durationMin: service.durationMin,
        price: service.price,
        currency: service.currency,

        startsAt,
        customerName,
        customerPhone,
        customerEmail: customerEmail || undefined,
        customerCountry: customerCountry || undefined,
        notes: notes || undefined
      }
    });
  } catch {
    return NextResponse.json(
      { error: "That slot is already booked. Choose another time." },
      { status: 409 }
    );
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000";

  const locale = getLocaleFromReferer(req);
  const manageLink = `${baseUrl}/${locale}/book/${business.slug}/success?id=${encodeURIComponent(
    booking.id
  )}`;

  // Email date/time in business local
  const dateText = localDate;
  const timeText = requestedTime;
  const priceText = money(service.price, service.currency);

  if (customerEmail) {
    try {
      await sendBookingConfirmationEmail({
        to: customerEmail,
        businessName: business.name,
        serviceName: service.name,
        date: dateText,
        time: timeText,
        durationMin: service.durationMin,
        priceText,
        manageLink
      });
    } catch (e) {
      console.error("[booking] customer email failed", e);
    }
  }

  try {
    const ownerExtra =
      `Customer: ${customerName} (${customerPhone})` +
      (customerEmail ? `, ${customerEmail}` : "") +
      (notes ? ` • Notes: ${notes}` : "");

    await sendBookingConfirmationEmail({
      to: business.ownerEmail,
      businessName: business.name,
      serviceName: `${service.name} — ${ownerExtra}`,
      date: dateText,
      time: timeText,
      durationMin: service.durationMin,
      priceText,
      manageLink
    });
  } catch (e) {
    console.error("[booking] owner email failed", e);
  }

  return NextResponse.json({
    booking: { ...booking, startsAt: booking.startsAt.toISOString() }
  });
}
