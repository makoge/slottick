import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthedBusiness } from "@/lib/auth";
import { businessHasAccess } from "@/lib/subscription";
import { hasValidOrigin } from "@/lib/request-security";

export const runtime = "nodejs";

function json(data: any, status = 200) {
  return NextResponse.json(data, status ? { status } : undefined);
}

function asString(v: unknown) {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ bookingId: string }> },
) {
  if (!hasValidOrigin(req)) {
    return json({ error: "Forbidden" }, 403);
  }

  const authed = await getAuthedBusiness();
  if (!authed) return json({ error: "Unauthorized" }, 401);

  if (!businessHasAccess(authed)) {
    return json({ error: "Subscription inactive." }, 402);
  }

  const { bookingId } = await params;
  const bodyJson = await req.json().catch(() => ({}));
  const action = asString(bodyJson.action).trim().toLowerCase();

  if (!["accept", "decline"].includes(action)) {
    return json({ error: "Invalid action." }, 400);
  }

  const booking = await prisma.booking.findFirst({
    where: {
      id: bookingId,
      businessId: authed.id,
    },
    include: {
      conversation: true,
      staff: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!booking) {
    return json({ error: "Booking not found." }, 404);
  }

  // Conflict prevention: If accepting and a staff member is assigned, ensure no overlaps
  if (action === "accept" && booking.staffId) {
    const conflict = await prisma.booking.findFirst({
      where: {
        id: { not: booking.id },
        businessId: authed.id,
        staffId: booking.staffId,
        status: "CONFIRMED",
        startsAt: { lt: booking.endsAt },
        endsAt: { gt: booking.startsAt },
      },
      select: { id: true },
    });

    if (conflict) {
      return json(
        {
          error:
            "Cannot accept this request: the specialist already has a confirmed booking in this time window.",
        },
        409,
      );
    }
  }

  const nextStatus = action === "accept" ? "CONFIRMED" : "DECLINED";

  const updated = await prisma.booking.update({
    where: { id: booking.id },
    data: {
      status: nextStatus,
      respondedAt: new Date(),
      statusUpdatedAt: new Date(),
      ...(action === "decline" ? { cancelledAt: new Date() } : {}),
    },
    select: {
      id: true,
      status: true,
      startsAt: true,
      endsAt: true,
    },
  });

  if (booking.conversation) {
    const staffNote = booking.staff?.name ? ` with ${booking.staff.name}` : "";
    const systemText =
      action === "accept"
        ? `Booking confirmed${staffNote}.`
        : `Booking request declined.`;

    await prisma.bookingMessage.create({
      data: {
        conversationId: booking.conversation.id,
        businessId: authed.id,
        senderType: "SYSTEM",
        body: systemText,
      },
    });

    await prisma.bookingConversation.update({
      where: { id: booking.conversation.id },
      data: {
        lastMessageAt: new Date(),
      },
    });
  }

  return json({ booking: updated });
}
