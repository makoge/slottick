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
    orderBy: [{ lastMessageAt: "desc" }, { updatedAt: "desc" }],
    include: {
      booking: {
        select: {
          id: true,
          status: true,
          startsAt: true,
          endsAt: true,
          customerName: true,
          customerEmail: true,
          customerPhone: true,
          serviceName: true,
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
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          id: true,
          body: true,
          senderType: true,
          createdAt: true,
        },
      },
      _count: {
        select: {
          messages: {
            where: {
              senderType: "CUSTOMER",
              isRead: false,
            },
          },
        },
      },
    },
  });

  return json({
    conversations: conversations.map((c) => ({
      id: c.id,
      bookingId: c.bookingId,
      bookingStatus: c.booking.status,
      startsAt: c.booking.startsAt.toISOString(),
      endsAt: c.booking.endsAt.toISOString(),
      customerName: c.booking.customerName,
      customerEmail: c.booking.customerEmail,
      customerPhone: c.booking.customerPhone,
      serviceName: c.booking.serviceName,
      staff: c.booking.staff
        ? {
            id: c.booking.staff.id,
            name: c.booking.staff.name,
            title: c.booking.staff.title,
            avatarUrl: c.booking.staff.avatarUrl,
          }
        : null,
      lastMessageAt: c.lastMessageAt?.toISOString() ?? null,
      lastMessage: c.messages[0]
        ? {
            ...c.messages[0],
            createdAt: c.messages[0].createdAt.toISOString(),
          }
        : null,
      unreadCount: c._count.messages,
    })),
  });
}
