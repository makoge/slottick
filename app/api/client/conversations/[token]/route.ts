import crypto from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

function json(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const tokenHash = hashToken(token);

  const conversation = await prisma.bookingConversation.findUnique({
    where: { clientTokenHash: tokenHash },
    include: {
      booking: true,
      business: {
        select: {
          name: true
        }
      },
      messages: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          body: true,
          senderType: true,
          createdAt: true
        }
      }
    }
  });

  if (!conversation) {
    return json({ error: "Conversation not found." }, 404);
  }

  return json({
    conversation: {
      id: conversation.id,
      bookingId: conversation.bookingId,
      bookingStatus: conversation.booking.status,
      businessName: conversation.business.name,
      serviceName: conversation.booking.serviceName,
      startsAt: conversation.booking.startsAt.toISOString(),
      customerName: conversation.booking.customerName,
      messages: conversation.messages.map((m) => ({
        ...m,
        createdAt: m.createdAt.toISOString()
      }))
    }
  });
}