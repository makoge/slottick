import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

function isEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const workspaceId = String(body.workspaceId ?? "").trim(); // you can make this later
    const to = String(body.to ?? "").trim();
    const subject = String(body.subject ?? "").trim();
    const html = String(body.html ?? "").trim();
    const replyTo = body.replyTo ? String(body.replyTo).trim() : undefined;

    const sendAtRaw = String(body.sendAt ?? "").trim(); // ISO string
    const sendAt = new Date(sendAtRaw);

    if (!workspaceId || !to || !subject || !html || !sendAtRaw) {
      return NextResponse.json({ ok: false, error: "Missing fields" }, { status: 400 });
    }
    if (!isEmail(to)) return NextResponse.json({ ok: false, error: "Invalid email" }, { status: 400 });
    if (replyTo && !isEmail(replyTo)) return NextResponse.json({ ok: false, error: "Invalid reply-to" }, { status: 400 });
    if (Number.isNaN(sendAt.getTime())) {
      return NextResponse.json({ ok: false, error: "Invalid sendAt" }, { status: 400 });
    }
    if (subject.length > 200) return NextResponse.json({ ok: false, error: "Subject too long" }, { status: 400 });
    if (html.length > 80_000) return NextResponse.json({ ok: false, error: "Message too long" }, { status: 400 });

    const msg = await prisma.scheduledMessage.create({
      data: {
        workspaceId,
        channel: "email",
        to,
        replyTo,
        subject,
        html,
        sendAt,
        // optional dedupeKey
        dedupeKey: body.dedupeKey ? String(body.dedupeKey) : undefined,
      },
      select: { id: true, sendAt: true, status: true },
    });

    return NextResponse.json({ ok: true, message: msg });
  } catch (err) {
    console.error("[cfu/schedule] error:", err);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}