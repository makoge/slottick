import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthedBusiness } from "@/lib/auth";
import { businessHasAccess } from "@/lib/subscription";
import { hasValidOrigin } from "@/lib/request-security";
import { sendClientFollowUpEmail } from "@/lib/email";

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
  console.log("BUSINESS MESSAGE ROUTE HIT");
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
    clientToken: true,
    business: {
      select: {
        name: true,
      },
    },
    booking: {
      select: {
        id: true,
        status: true,
        serviceName: true,
        customerEmail: true,
        customerName: true,
      },
    },
  },
});


  if (!conversation) {
    return json({ error: "Conversation not found." }, 404);
  }

  const clientToken = conversation.clientToken;

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

  await prisma.bookingConversation.update({
    where: { id: conversation.id },
    data: {
      lastMessageAt: new Date(),
    },
  });

  if (conversation.booking.status === "PENDING") {
    await prisma.booking.update({
      where: { id: conversation.booking.id },
      data: {
        status: "NEEDS_INFO",
        statusUpdatedAt: new Date(),
      },
    });
  }

  try {
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://slottick.com";

    const locale = "en";

    console.log("BUSINESS MESSAGE EMAIL DEBUG:", {
  customerEmail: conversation.booking.customerEmail,
  clientToken,
  businessName: conversation.business.name,
  serviceName: conversation.booking.serviceName,
});
    

    if (!conversation.booking.customerEmail) {
  console.warn("No customer email, skipping client message email.");
} else if (!clientToken) {
  console.warn("No clientToken, skipping client message email. This may be an old conversation.");
} else {
  const chatLink = `${siteUrl}/${locale}/booking-chat/${clientToken}`;

  const emailResult = await sendClientFollowUpEmail({
    to: conversation.booking.customerEmail,
    subject: `New message from ${conversation.business.name}`,
    html: `
      <p>Hello ${conversation.booking.customerName || "there"},</p>

      <p>You received a new message about your booking.</p>

      <p>
        <strong>Business:</strong> ${conversation.business.name}<br/>
        <strong>Service:</strong> ${conversation.booking.serviceName}
      </p>

      <p>
        <strong>Message:</strong><br/>
        ${body}
      </p>

      <p>
        <a href="${chatLink}" style="display:inline-block;padding:12px 18px;background:#0f172a;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:600">
          Open booking chat
        </a>
      </p>
    `,
  });

  console.log("CLIENT MESSAGE EMAIL RESULT:", emailResult);
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