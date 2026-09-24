import crypto from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthedBusiness } from "@/lib/auth";
import { businessHasAccess } from "@/lib/subscription";
import { hasValidOrigin } from "@/lib/request-security";
import { sendClientFollowUpEmail } from "@/lib/email";

export const runtime = "nodejs";

function json(data: any, status = 200) {
  return NextResponse.json(data, status ? { status } : undefined);
}

function asString(v: unknown) {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ conversationId: string }> },
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
      businessId: authed.id,
    },
    select: {
      id: true,
      businessId: true,
      clientTokenHash: true,
      business: {
        select: {
          name: true,
          slug: true,
        },
      },
      booking: {
        select: {
          id: true,
          status: true,
          serviceName: true,
          customerEmail: true,
          customerName: true,
          staff: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  if (!conversation) {
    return json({ error: "Conversation not found." }, 404);
  }

  // Generate a fresh client access token for this email notification
  const rawToken = crypto.randomBytes(32).toString("hex");
  const newClientTokenHash = hashToken(rawToken);

  // 1. Create the business message
  const message = await prisma.bookingMessage.create({
    data: {
      conversationId: conversation.id,
      businessId: authed.id,
      senderType: "BUSINESS",
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

  // 2. Update conversation timestamp and set the updated token hash
  await prisma.bookingConversation.update({
    where: { id: conversation.id },
    data: {
      lastMessageAt: new Date(),
      clientTokenHash: newClientTokenHash,
    },
  });

  // 3. If booking was PENDING, bump to NEEDS_INFO
  if (conversation.booking.status === "PENDING") {
    await prisma.booking.update({
      where: { id: conversation.booking.id },
      data: {
        status: "NEEDS_INFO",
        statusUpdatedAt: new Date(),
      },
    });
  }

  // 4. Send follow-up email with secure one-click link
  try {
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
      "https://slottick.com";
    const locale = "en";

    if (conversation.booking.customerEmail) {
      const chatLink = `${siteUrl}/${locale}/booking-chat/${rawToken}`;
      const staffInfo = conversation.booking.staff?.name
        ? ` (${conversation.booking.staff.name})`
        : "";

      await sendClientFollowUpEmail({
        to: conversation.booking.customerEmail,
        subject: `New message from ${conversation.business.name}`,
        html: `
          <p>Hello ${conversation.booking.customerName || "there"},</p>
          <p>You received a new message regarding your appointment.</p>
          <p>
            <strong>Business:</strong> ${conversation.business.name}<br/>
            <strong>Service:</strong> ${conversation.booking.serviceName}${staffInfo}
          </p>
          <blockquote style="margin:16px 0;padding:12px 16px;background:#f8fafc;border-left:4px solid #0f172a;border-radius:4px;">
            ${body}
          </blockquote>
          <p>
            <a
              href="${chatLink}"
              style="display:inline-block;padding:12px 18px;background:#0f172a;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:600"
            >
              Open Booking Chat
            </a>
          </p>
        `,
      });
    }
  } catch (emailErr) {
    console.error("Business message email failed:", emailErr);
  }

  return json({
    message: {
      ...message,
      createdAt: message.createdAt.toISOString(),
    },
  });
}
