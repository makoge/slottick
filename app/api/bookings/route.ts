import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

function json(res: any, status = 200) {
  return NextResponse.json(res, { status });
}

function asString(v: unknown) {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

function isIsoDate(v: string) {
  const d = new Date(v);
  return Number.isFinite(d.getTime()) && v.includes("T");
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any));

    // Accept multiple possible client keys (robust)
    const businessSlug = asString(body.businessSlug || body.slug).trim();
    const serviceName = asString(body.serviceName || body.service).trim();

    const durationMin = Number(body.durationMin ?? body.duration ?? 0);
    const price = Number(body.price ?? 0);
    const currency = asString(body.currency ?? "EUR").trim().toUpperCase();

    const startsAt = asString(body.startsAt || body.start).trim();

    const customerName = asString(body.customerName || body.fullName || body.name).trim();
    const customerPhone = asString(body.customerPhone || body.phone).trim();

    // BookingClient sends customerEmail
    const customerEmail = asString(body.customerEmail || body.email).trim();

    const notes = body.notes == null ? null : asString(body.notes).trim() || null;

    // Validate required fields + return exact missing list
    const missing: string[] = [];
    if (!businessSlug) missing.push("businessSlug");
    if (!serviceName) missing.push("serviceName");
    if (!durationMin || durationMin <= 0) missing.push("durationMin");
    if (!Number.isFinite(price)) missing.push("price");
    if (!currency) missing.push("currency");
    if (!startsAt) missing.push("startsAt");
    if (!customerName) missing.push("customerName");
    if (!customerPhone) missing.push("customerPhone");
    if (!customerEmail) missing.push("customerEmail");

    if (missing.length) {
      return json(
        {
          error: "Missing fields",
          missing,
          receivedKeys: Object.keys(body ?? {})
        },
        400
      );
    }

    if (!isIsoDate(startsAt)) {
      return json({ error: "startsAt must be an ISO datetime string." }, 400);
    }

    // Find business
    const business = await prisma.business.findUnique({
      where: { slug: businessSlug },
      select: { id: true, marketplaceEligibleAt: true }
    });

    if (!business) return json({ error: "Business not found." }, 404);

    // Optional: block bookings if not eligible
    // if (!business.marketplaceEligibleAt) return json({ error: "Business not public yet." }, 403);

    // Try linking to actual Service by name (or allow serviceId if you ever add it)
    const serviceId = body.serviceId
      ? asString(body.serviceId).trim()
      : null;

    let resolvedServiceId: string | null = null;
    let resolvedCategory: any = null;

    if (serviceId) {
      const s = await prisma.service.findFirst({
        where: { id: serviceId, businessId: business.id },
        select: { id: true, category: true }
      });
      if (s) {
        resolvedServiceId = s.id;
        resolvedCategory = s.category;
      }
    } else {
      const s = await prisma.service.findFirst({
        where: { businessId: business.id, name: serviceName },
        select: { id: true, category: true }
      });
      if (s) {
        resolvedServiceId = s.id;
        resolvedCategory = s.category;
      }
    }

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        businessId: business.id,
        serviceId: resolvedServiceId,
        serviceCategory: resolvedCategory,

        serviceName,
        durationMin,
        price,
        currency,

        startsAt: new Date(startsAt),

        customerName,
        customerPhone,
        customerEmail,
        notes
      },
      select: { id: true }
    });

    return json({ booking }, 200);
  } catch (err: any) {
    // Prisma unique constraint (double-booked slot)
    if (err?.code === "P2002") {
      return json({ error: "That slot is already booked." }, 409);
    }
    console.error("POST /api/bookings failed:", err);
    return json({ error: "Booking failed." }, 500);
  }
}
