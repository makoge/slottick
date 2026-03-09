import { NextResponse } from "next/server";
import { sendClientFollowUpEmail } from "@/lib/email";

export const runtime = "nodejs";

function isEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function getClientIp(req: Request) {
  const xff = req.headers.get("x-forwarded-for");
  if (!xff) return "unknown";
  return xff.split(",")[0]?.trim() || "unknown";
}

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const b = buckets.get(key);

  if (!b || now > b.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  if (b.count >= limit) {
    return { ok: false, remaining: 0, resetAt: b.resetAt };
  }

  b.count += 1;
  buckets.set(key, b);
  return { ok: true, remaining: limit - b.count, resetAt: b.resetAt };
}

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);

    const rl = rateLimit(`cfu:${ip}`, 10, 10 * 60_000);
    if (!rl.ok) {
      return NextResponse.json(
        { ok: false, error: "Too many requests. Try later." },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.max(1, Math.ceil((rl.resetAt - Date.now()) / 1000))),
          },
        }
      );
    }

    const body = await req.json();

    const to = String(body.to ?? "").trim();
    const subject = String(body.subject ?? "").trim();
    const html = String(body.html ?? "").trim();
    const replyTo = body.replyTo ? String(body.replyTo).trim() : undefined;

    const sendAtRaw = body.sendAt ? String(body.sendAt) : undefined;
    let scheduledAt: string | undefined;

    if (sendAtRaw) {
      const d = new Date(sendAtRaw);

      if (Number.isNaN(d.getTime())) {
        return NextResponse.json({ ok: false, error: "Invalid send date" }, { status: 400 });
      }

      scheduledAt = d.toISOString();
    }

    const website = String(body.website ?? "").trim();
    if (website) return NextResponse.json({ ok: true });

    if (!to || !subject || !html) {
      return NextResponse.json({ ok: false, error: "Missing fields" }, { status: 400 });
    }

    if (!isEmail(to)) {
      return NextResponse.json({ ok: false, error: "Invalid recipient email" }, { status: 400 });
    }

    if (replyTo && !isEmail(replyTo)) {
      return NextResponse.json({ ok: false, error: "Invalid reply-to email" }, { status: 400 });
    }

    if (subject.length > 200) {
      return NextResponse.json({ ok: false, error: "Subject too long" }, { status: 400 });
    }

    if (html.length > 80_000) {
      return NextResponse.json({ ok: false, error: "Message too long" }, { status: 400 });
    }

    const sent = await sendClientFollowUpEmail({
      to,
      subject,
      html,
      replyTo,
      scheduledAt,
      footer: "Powered by Slottick",
    });

    if (!sent?.ok) {
      return NextResponse.json({ ok: false, error: sent?.error ?? "Send failed" }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      remaining: rl.remaining,
      scheduled: scheduledAt ?? null,
    });

  } catch (err) {
    console.error("[client-follow-up/send] route error:", err);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}