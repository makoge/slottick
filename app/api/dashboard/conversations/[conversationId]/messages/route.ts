import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthedBusiness } from "@/lib/auth";
import { businessHasAccess } from "@/lib/subscription";
import { hasValidOrigin } from "@/lib/request-security";

export const runtime = "nodejs";

function json(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

function asString(v: unknown) {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  if (!hasValidOrigin(req)) {
    return json({ error: "Forbidden" }, 403);
  }

  const authed = await getAuthedBusiness();
  if (!authed) return json({ error: "Unauthorized" }, 401);

  if (!businessHasAccess(authed)) {
    return json({ error: "Subscription inactive." }, 402);
  }

  const { conversationId } = await params;
  const bodyJson = await req.json().catch(() => ({}));
  const body = asString(bodyJson.body).trim();

  if (!body) {
    return json({ error: "Message is required." }, 400);
  }

  const conversation = await prisma.bookingConversation.findFirst({
    where: {
      id: conversationId,
      businessId: authed.id
    },
    include: {
      booking: {
        select: {
          id: true,
          status: true
        }
      }
    }
  });

  if (!conversation) {
    return json({ error: "Conversation not found." }, 404);
  }

  const message = await prisma.bookingMessage.create({
    data: {
      conversationId: conversation.id,
      businessId: authed.id,
      senderType: "BUSINESS",
      body,
      isRead: false
    },
    select: {
      id: true,
      body: true,
      senderType: true,
      isRead: true,
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
      where: { id: conversation.booking.id },
      data: {
        status: "NEEDS_INFO",
        statusUpdatedAt: new Date()
      }
    });
  }

  return json({
    message: {
      ...message,
      createdAt: message.createdAt.toISOString()
    }
  });
}