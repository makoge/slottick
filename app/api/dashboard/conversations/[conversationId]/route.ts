import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthedBusiness } from "@/lib/auth";
import { businessHasAccess } from "@/lib/subscription";

export const runtime = "nodejs";

function json(data: any, status = 200) {
  return NextResponse.json(data, status ? { status } : undefined);
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ conversationId: string }> },
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
      businessId: authed.id,
    },
    include: {
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
          customerEmail: true,
          customerPhone: true,
          notes: true,
          respondedAt: true,
          statusUpdatedAt: true,
          depositPaid: true,
          depositAmount: true,
          paymentStatus: true,
          staffId: true,
          staff: {
            select: {
              id: true,
              name: true,
              title: true,
              avatarUrl: true,
            },
          },
          items: {
            select: {
              id: true,
              serviceName: true,
              durationMin: true,
              price: true,
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
          isRead: true,
          createdAt: true,
        },
      },
    },
  });

  if (!conversation) {
    return json({ error: "Conversation not found." }, 404);
  }

  // Mark unread customer messages as read
  await prisma.bookingMessage.updateMany({
    where: {
      conversationId: conversation.id,
      senderType: "CUSTOMER",
      isRead: false,
    },
    data: {
      isRead: true,
    },
  });

  // Pull CRM profile if available for customer context in chat
  let customerProfile = null;
  if (conversation.booking.customerPhone) {
    customerProfile = await prisma.businessCustomerProfile.findUnique({
      where: {
        businessId_phone: {
          businessId: authed.id,
          phone: conversation.booking.customerPhone,
        },
      },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        notes: true,
        isBlocked: true,
        noShowCount: true,
        totalVisits: true,
      },
    });
  }

  return json({
    conversation: {
      id: conversation.id,
      bookingId: conversation.bookingId,
      booking: {
        ...conversation.booking,
        startsAt: conversation.booking.startsAt.toISOString(),
        endsAt: conversation.booking.endsAt.toISOString(),
        respondedAt: conversation.booking.respondedAt?.toISOString() ?? null,
        statusUpdatedAt:
          conversation.booking.statusUpdatedAt?.toISOString() ?? null,
      },
      customerProfile,
      messages: conversation.messages.map((m) => ({
        ...m,
        createdAt: m.createdAt.toISOString(),
      })),
    },
  });
}
