import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthedBusiness } from "@/lib/auth";
import { businessHasAccess } from "@/lib/subscription";

export const runtime = "nodejs";

function json(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

export async function GET() {
  const authed = await getAuthedBusiness();
  if (!authed) return json({ error: "Unauthorized" }, 401);

  if (!businessHasAccess(authed)) {
    return json({ error: "Subscription inactive." }, 402);
  }

  const conversations = await prisma.bookingConversation.findMany({
    where: { businessId: authed.id },
    orderBy: [
      { lastMessageAt: "desc" },
      { updatedAt: "desc" }
    ],
    include: {
      booking: {
        select: {
          id: true,
          status: true,
          startsAt: true,
          customerName: true,
          customerEmail: true,
          customerPhone: true,
          serviceName: true
        }
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          id: true,
          body: true,
          senderType: true,
          createdAt: true
        }
      },
      _count: {
        select: {
          messages: {
            where: {
              senderType: "CUSTOMER",
              isRead: false
            }
          }
        }
      }
    }
  });

  return json({
    conversations: conversations.map((c) => ({
      id: c.id,
      bookingId: c.bookingId,
      bookingStatus: c.booking.status,
      startsAt: c.booking.startsAt.toISOString(),
      customerName: c.booking.customerName,
      customerEmail: c.booking.customerEmail,
      customerPhone: c.booking.customerPhone,
      serviceName: c.booking.serviceName,
      lastMessageAt: c.lastMessageAt?.toISOString() ?? null,
      lastMessage: c.messages[0]
        ? {
            ...c.messages[0],
            createdAt: c.messages[0].createdAt.toISOString()
          }
        : null,
      unreadCount: c._count.messages
    }))
  });
}