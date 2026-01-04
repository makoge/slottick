import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import crypto from "crypto";
import { sendReviewRequestEmail } from "@/lib/email";

function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export async function POST(req: Request) {
  // (optional) protect this with a secret header in production
  const now = new Date();

  // bookings that:
  // - confirmed
  // - ended already
  // - not emailed yet
  // - not reviewed yet
  const due = await prisma.booking.findMany({
    where: {
      status: "CONFIRMED",
      reviewEmailSentAt: null,
      review: null
    },
    include: { business: true }
  });

  let sent = 0;

  for (const b of due) {
    const endsAt = new Date(b.startsAt.getTime() + b.durationMin * 60_000);
    if (endsAt.getTime() > now.getTime()) continue;
    if (!b.customerEmail) continue;

    const token = crypto.randomUUID();
    const tokenHash = sha256(token);

    // store token + mark emailed
    await prisma.booking.update({
      where: { id: b.id },
      data: {
        reviewTokenHash: tokenHash,
        reviewEmailSentAt: new Date()
      }
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const reviewLink =
      `${baseUrl}/en/book/${b.business.slug}/review` +
      `?bookingId=${encodeURIComponent(b.id)}` +
      `&token=${encodeURIComponent(token)}`;

    const date = b.startsAt.toISOString().slice(0, 10); // YYYY-MM-DD
const time = b.startsAt.toISOString().slice(11, 16); // HH:MM (UTC)

await sendReviewRequestEmail({
  to: b.customerEmail,
  businessName: b.business.name,
  serviceName: b.serviceName,
  date,
  time,
  reviewLink,
});


    sent++;
  }

  return NextResponse.json({ ok: true, sent });
}
