// app/api/booking-chat/[token]/route.ts
import crypto from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hasValidOrigin } from "@/lib/request-security";
import { sendPushToBusiness } from "@/lib/push";

export const runtime = "nodejs";

function json(data: any, status = 200) {
  return NextResponse.json(data, status ? { status } : undefined);
}

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function asString(v: unknown) {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

/**
 * GET /api/booking-chat/[token]
 * Fetches the conversation and booking overview for the client.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  if (!token) {
    return json({ error: "Missing access token" }, 400);
  }

  const tokenHash = hashToken(token.trim());

  const conversation = await prisma.bookingConversation.findUnique({
    where: { clientTokenHash: tokenHash },
    include: {
      business: {
        select: {
          id: true,
          name: true,
          slug: true,
          logoUrl: true,
          city: true,
          country: true,
        },
      },
      booking: {
        select: {
          id: true,
          status: true,
          startsAt: true,
          endsAt: true,
          durationMin: true,
          serviceName: true,
          price: true,
          currency: true,
          customerName: true,
          staffId: true,
          staff: {
            select: {
              id: true,
              name: true,
              title: true,
              avatarUrl: true,
            },
          },
        },
      },
      messages: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          body: true,
          senderType: true,
          createdAt: true,
        },
      },
    },
  });

  if (!conversation) {
    return json({ error: "Invalid or expired chat link" }, 404);
  }

  // Mark business messages as read when the client opens the thread
  await prisma.bookingMessage.updateMany({
    where: {
      conversationId: conversation.id,
      senderType: "BUSINESS",
      isRead: false,
    },
    data: {
      isRead: true,
    },
  });

  return json({
    conversation: {
      id: conversation.id,
      business: conversation.business,
      booking: {
        ...conversation.booking,
        startsAt: conversation.booking.startsAt.toISOString(),
        endsAt: conversation.booking.endsAt.toISOString(),
      },
      messages: conversation.messages.map((m) => ({
        ...m,
        createdAt: m.createdAt.toISOString(),
      })),
    },
  });
}

/**
 * POST /api/booking-chat/[token]
 * Sends a message from the client to the business.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  if (!hasValidOrigin(req)) {
    return json({ error: "Forbidden" }, 403);
  }

  const { token } = await params;
  if (!token) {
    return json({ error: "Missing access token" }, 400);
  }

  const bodyJson = await req.json().catch(() => ({}));
  const body = asString(bodyJson.body).trim();

  if (!body) {
    return json({ error: "Message cannot be empty." }, 400);
  }

  const tokenHash = hashToken(token.trim());

  const conversation = await prisma.bookingConversation.findUnique({
    where: { clientTokenHash: tokenHash },
    select: {
      id: true,
      businessId: true,
      booking: {
        select: {
          id: true,
          customerName: true,
          serviceName: true,
        },
      },
    },
  });

  if (!conversation) {
    return json({ error: "Invalid or expired chat link." }, 404);
  }

  // 1. Create client message
  const message = await prisma.bookingMessage.create({
    data: {
      conversationId: conversation.id,
      businessId: conversation.businessId,
      senderType: "CUSTOMER",
      body,
      isRead: false,
    },
    select: {
      id: true,
      body: true,
      senderType: true,
      isRead: true,
      createdAt: true,
    },
  });

  // 2. Bump conversation lastMessageAt
  await prisma.bookingConversation.update({
    where: { id: conversation.id },
    data: {
      lastMessageAt: new Date(),
    },
  });

  // 3. Notify the business owner
  const customerName = conversation.booking.customerName || "A customer";
  await prisma.notification.create({
    data: {
      businessId: conversation.businessId,
      bookingId: conversation.booking.id,
      type: "NEW_MESSAGE",
      title: `New message from ${customerName}`,
      body: body.length > 80 ? `${body.slice(0, 77)}...` : body,
    },
  });

  await sendPushToBusiness(conversation.businessId, {
    title: `Message from ${customerName}`,
    body: body.length > 80 ? `${body.slice(0, 77)}...` : body,
    url: `/en/dashboard/inbox/${conversation.id}`,
    tag: `chat-${conversation.id}`,
  });

  return json({
    message: {
      ...message,
      createdAt: message.createdAt.toISOString(),
    },
  });
}
