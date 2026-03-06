import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendClientFollowUpEmail } from "@/lib/email";

export const runtime = "nodejs";

// Protect cron endpoint (set in Vercel env)
function authorized(req: Request) {
  const secret = process.env.CRON_SECRET || "";
  if (!secret) return true; // allow locally
  return req.headers.get("x-cron-secret") === secret;
}

export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const limit = 25; // batch size

  try {
    // 1) claim messages (avoid double sends)
    const due = await prisma.scheduledMessage.findMany({
      where: {
        status: "scheduled",
        sendAt: { lte: now },
      },
      orderBy: { sendAt: "asc" },
      take: limit,
    });

    let sent = 0;
    let failed = 0;

    for (const m of due) {
      // claim
      const claimed = await prisma.scheduledMessage.updateMany({
        where: { id: m.id, status: "scheduled" },
        data: { status: "sending", attempts: { increment: 1 } },
      });

      if (claimed.count !== 1) continue; // already taken by another run

      const res = await sendClientFollowUpEmail({
        to: m.to,
        subject: m.subject,
        html: m.html,
        replyTo: m.replyTo ?? undefined,
        footer: "Powered by Slottick",
      });

      if (res?.ok) {
        sent++;
        await prisma.scheduledMessage.update({
          where: { id: m.id },
          data: { status: "sent", providerMessageId: (res as any)?.res?.id ?? null, lastError: null },
        });
      } else {
        failed++;
        // retry policy: up to 3 attempts, then failed
        const attempts = m.attempts + 1;
        const nextStatus = attempts >= 3 ? "failed" : "scheduled";
        const backoffMinutes = attempts === 1 ? 5 : attempts === 2 ? 30 : 0;

        await prisma.scheduledMessage.update({
          where: { id: m.id },
          data: {
            status: nextStatus,
            lastError: (res as any)?.error ?? "Send failed",
            sendAt: nextStatus === "scheduled" ? new Date(Date.now() + backoffMinutes * 60_000) : m.sendAt,
          },
        });
      }
    }

    return NextResponse.json({ ok: true, processed: due.length, sent, failed, now: now.toISOString() });
  } catch (err) {
    console.error("[cron/cfu] error:", err);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}