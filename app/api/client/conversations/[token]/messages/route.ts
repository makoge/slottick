import crypto from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hasValidOrigin } from "@/lib/request-security";

export const runtime = "nodejs";

function json(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

function asString(v: unknown) {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  if (!hasValidOrigin(req)) {
    return json({ error: "Forbidden" }, 403);
  }

  const { token } = await params;
  const bodyJson = await req.json().catch(() => ({}));
  const body = asString(bodyJson.body).trim();

  if (!body) {
    return json({ error: "Message is required." }, 400);
  }

  const tokenHash = hashToken(token);

  const conversation = await prisma.bookingConversation.findUnique({
    where: { clientTokenHash: tokenHash },
    include: {
      booking: true
    }
  });

  if (!conversation) {
    return json({ error: "Conversation not found." }, 404);
  }

  const message = await prisma.bookingMessage.create({
    data: {
      conversationId: conversation.id,
      customerId: conversation.customerId ?? null,
      senderType: "CUSTOMER",
      body
    },
    select: {
      id: true,
      body: true,
      senderType: true,
      createdAt: true
    }
  });

  await prisma.bookingConversation.update({
    where: { id: conversation.id },
    data: {
      lastMessageAt: new Date()
    }
  });

  if (conversation.booking.status === "PENDING") {
    await prisma.booking.update({
      where: { id: conversation.bookingId },
      data: {
        status: "NEEDS_INFO",
        statusUpdatedAt: new Date()
      }
    });
  }

  await prisma.notification.create({
    data: {
      businessId: conversation.businessId,
      bookingId: conversation.bookingId,
      type: "CLIENT_MESSAGE",
      title: "New client message",
      body: body.slice(0, 120)
    }
  });

  return json({
    message: {
      ...message,
      createdAt: message.createdAt.toISOString()
    }
  });
}