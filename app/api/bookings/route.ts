// app/api/bookings/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthedBusiness } from "@/lib/auth";
import { businessHasAccess } from "@/lib/subscription";
import {
  sendBookingConfirmationEmail,
  sendClientFollowUpEmail,
} from "@/lib/email";
import { hasValidOrigin } from "@/lib/request-security";
import crypto from "crypto";
import { sendPushToBusiness } from "@/lib/push";

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

function asISO(d: unknown) {
  try {
    if (d instanceof Date) return d.toISOString();
    return new Date(String(d)).toISOString();
  } catch {
    return "";
  }
}

function formatMoneySimple(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}

function formatBookingDateParts(startsAtIso: string, timeZone: string) {
  const dt = new Date(startsAtIso);

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

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}



/**
 * GET /api/bookings?scope=owner
 * Used by dashboard BookingsPanel + stats
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const scope = url.searchParams.get("scope") || "";

  if (scope !== "owner") {
    return json({ error: "Unsupported scope" }, 400);
  }

  const authed = await getAuthedBusiness();
  if (!authed) return json({ error: "Unauthorized" }, 401);

  if (!businessHasAccess(authed)) {
    return json(
      {
        error: "Your free trial has ended. Please subscribe to continue.",
        code: "TRIAL_EXPIRED",
      },
      402
    );
  }

  const rows = await prisma.booking.findMany({
    where: { businessId: authed.id },
    orderBy: [{ startsAt: "asc" }],
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
    },
  });

  const bookings = rows.map((b) => ({
    ...b,
    startsAt: asISO(b.startsAt),
  }));

  return json({ bookings });
}

/**
 * POST /api/bookings
 * Used by BookingClient
 */
export async function POST(req: Request) {
  if (!hasValidOrigin(req)) {
  return json({ error: "Forbidden" }, 403);
}
  try {
    const body = await req.json().catch(() => ({} as any));

    const businessSlug = asString(body.businessSlug || body.slug).trim();
    const serviceName = asString(body.serviceName || body.service).trim();

    const durationMin = Number(body.durationMin ?? body.duration ?? 0);
    const price = Number(body.price ?? 0);
    const currency = asString(body.currency ?? "EUR").trim().toUpperCase();

    const startsAt = asString(body.startsAt || body.start).trim();

    const customerName = asString(body.customerName || body.fullName || body.name).trim();
    const customerPhone = asString(body.customerPhone || body.phone).trim();
    const customerEmail = asString(body.customerEmail || body.email).trim();

    const notes = body.notes == null ? null : asString(body.notes).trim() || null;

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
        { error: "Missing fields", missing, receivedKeys: Object.keys(body ?? {}) },
        400
      );
    }

    if (!isIsoDate(startsAt)) {
      return json({ error: "startsAt must be an ISO datetime string." }, 400);
    }
    
    const business = await prisma.business.findUnique({
      where: { slug: businessSlug },
      select: {
        id: true,
        name: true,
        slug: true,
        ownerEmail: true,
        subscriptionStatus: true,
        trialEndsAt: true,
        currentPeriodEnd: true,
        bookingApprovalRequired: true,
        availabilityRule: {
          select: {
            timezone: true,
          },
        },
      },
    });

    if (!business) {
      return json({ error: "Business not found." }, 404);
    }

    if (!businessHasAccess(business)) {
      return json(
        {
          error: "This business is not accepting bookings right now.",
          code: "SUBSCRIPTION_INACTIVE",
        },
        402
      );
    }
    const bookingStatus = business.bookingApprovalRequired ? "PENDING" : "CONFIRMED";
    const serviceId = body.serviceId ? asString(body.serviceId).trim() : null;

    let resolvedServiceId: string | null = null;
    let resolvedCategory: any = null;

    if (serviceId) {
      const s = await prisma.service.findFirst({
        where: { id: serviceId, businessId: business.id },
        select: { id: true, category: true },
      });
      if (s) {
        resolvedServiceId = s.id;
        resolvedCategory = s.category;
      }
    } else {
      const s = await prisma.service.findFirst({
        where: { businessId: business.id, name: serviceName },
        select: { id: true, category: true },
      });
      if (s) {
        resolvedServiceId = s.id;
        resolvedCategory = s.category;
      }
    }
     
    
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
        notes,
        status: bookingStatus,
        statusUpdatedAt: new Date(),
        respondedAt: bookingStatus === "CONFIRMED" ? new Date() : null,
       },
       select: { id: true, status: true },
     });
     
     console.log("🔥 BOOKING CREATED:", booking.id, booking.status);

     const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://slottick.com";
    const locale = asString(body.locale).trim() || "en";

let conversationId: string | null = null;
let clientChatLink: string | null = null;
let ownerRequestLink: string | null = null;


const businessTz = business.availabilityRule?.timezone || "UTC";
const { date, time } = formatBookingDateParts(startsAt, businessTz);
const priceText = formatMoneySimple(price, currency);


  const rawToken = crypto.randomBytes(32).toString("hex");
  const clientTokenHash = hashToken(rawToken);

  const conversation = await prisma.bookingConversation.create({
    data: {
      bookingId: booking.id,
      businessId: business.id,
      clientToken: rawToken,
      clientTokenHash,
      lastMessageAt: new Date(),
      messages: {
        create: {
          senderType: "SYSTEM",
          body:
  booking.status === "PENDING"
    ? `New request: ${customerName} wants ${serviceName} on ${date} at ${time}.`
    : `Confirmed: ${customerName} booked ${serviceName} on ${date} at ${time}.`
        }
      }
    },
    select: { id: true }
  });

  conversationId = conversation.id;

  clientChatLink = `${siteUrl}/${locale}/booking-chat/${rawToken}`;
  ownerRequestLink = `${siteUrl}/${locale}/dashboard/inbox/${conversationId}`;

  await prisma.notification.create({
    data: {
      businessId: business.id,
      bookingId: booking.id,
      type: "BOOKING_REQUEST",
      title: "New booking request",
      body: `${customerName} requested ${serviceName}`
    }
  });

  await sendPushToBusiness(business.id, {
  title: booking.status === "PENDING" ? "New booking request" : "New booking",
  body:
    booking.status === "PENDING"
      ? `${customerName} requested ${serviceName}`
      : `${customerName} booked ${serviceName}`,
  url: `/${locale}/dashboard/inbox/${conversationId}`,
  tag: `booking-${booking.id}`
});


    

    const manageLink = `${siteUrl}/${locale}/book/${business.slug}/success?id=${encodeURIComponent(
      booking.id
    )}`;

    

    try {
  if (booking.status === "CONFIRMED") {
    await sendBookingConfirmationEmail({
      to: customerEmail,
      businessName: business.name,
      serviceName,
      date,
      time,
      durationMin,
      priceText,
      manageLink,
      locale,
    });
  } else {
   await sendClientFollowUpEmail({
      to: customerEmail,
      subject: `Booking request received: ${serviceName}`,
      html: `
        <p>Your booking request has been received.</p>

        <p>
          <strong>Business:</strong> ${business.name}<br/>
          <strong>Service:</strong> ${serviceName}<br/>
          <strong>Date:</strong> ${date}<br/>
          <strong>Time:</strong> ${time}
        </p>

        <p>The business will review your request and respond soon.</p>

        ${
          clientChatLink
            ? `
              <p>
                <a
                  href="${clientChatLink}"
                  style="display:inline-block;padding:12px 18px;background:#0f172a;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:600"
                >
                  Open booking chat
                </a>
              </p>
            `
            : ""
        }
      `,
    });
  }

  if (business.ownerEmail) {
    const ownerLink = ownerRequestLink || `${siteUrl}/${locale}/dashboard`;

    await sendClientFollowUpEmail({
      to: business.ownerEmail,
      subject:
        booking.status === "PENDING"
          ? `New booking request: ${serviceName}`
          : `New booking: ${serviceName}`,
      html: `
        <p>You have a new ${booking.status === "PENDING" ? "booking request" : "booking"}.</p>

        <p>
          <strong>Customer:</strong> ${customerName}<br/>
          <strong>Email:</strong> ${customerEmail}<br/>
          <strong>Phone:</strong> ${customerPhone}<br/>
          <strong>Service:</strong> ${serviceName}<br/>
          <strong>Date:</strong> ${date}<br/>
          <strong>Time:</strong> ${time}<br/>
          <strong>Duration:</strong> ${durationMin} min<br/>
          <strong>Price:</strong> ${priceText}
          ${notes ? `<br/><strong>Notes:</strong> ${notes}` : ""}
        </p>

        <p>
          <a
            href="${ownerLink}"
            style="display:inline-block;padding:12px 18px;background:#0f172a;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:600"
          >
            ${ownerRequestLink ? "Open booking request" : "Open dashboard"}
          </a>
        </p>
      `,
      replyTo: customerEmail,
    });
  }
} catch (emailErr) {
  console.error("Booking email send failed:", emailErr);
}

    return json({ booking }, 200);
  } catch (err: any) {
    if (err?.code === "P2002") {
      return json({ error: "That slot is already booked." }, 409);
    }

    console.error("POST /api/bookings failed:", err);
    return json({ error: "Booking failed." }, 500);
  }
}
