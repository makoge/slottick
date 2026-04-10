import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthedBusiness } from "@/lib/auth";
import { businessHasAccess } from "@/lib/subscription";

export const runtime = "nodejs";

function json(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const authed = await getAuthedBusiness();
  if (!authed) return json({ error: "Unauthorized" }, 401);

  if (!businessHasAccess(authed)) {
    return json({ error: "Subscription inactive." }, 402);
  }

  const { conversationId } = await params;

  const conversation = await prisma.bookingConversation.findFirst({
    where: {
      id: conversationId,
      businessId: authed.id
    },
    include: {
      booking: {
        select: {
          id: true,
          status: true,
          startsAt: true,
          durationMin: true,
          serviceName: true,
          price: true,
          currency: true,
          customerName: true,
          customerEmail: true,
          customerPhone: true,
          notes: true,
          respondedAt: true,
          statusUpdatedAt: true
        }
      },
      messages: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          body: true,
          senderType: true,
          isRead: true,
          createdAt: true
        }
      }
    }
  });

  if (!conversation) {
    return json({ error: "Conversation not found." }, 404);
  }

  await prisma.bookingMessage.updateMany({
    where: {
      conversationId: conversation.id,
      senderType: "CUSTOMER",
      isRead: false
    },
    data: {
      isRead: true
    }
  });

  return json({
    conversation: {
      id: conversation.id,
      bookingId: conversation.bookingId,
      booking: {
        ...conversation.booking,
        startsAt: conversation.booking.startsAt.toISOString(),
        respondedAt: conversation.booking.respondedAt?.toISOString() ?? null,
        statusUpdatedAt: conversation.booking.statusUpdatedAt?.toISOString() ?? null
      },
      messages: conversation.messages.map((m) => ({
        ...m,
        createdAt: m.createdAt.toISOString()
      }))
    }
  });
}