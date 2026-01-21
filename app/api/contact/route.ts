import { NextResponse } from "next/server";
import { notifyOwnerContactMessage } from "@/lib/email";

function isEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function getClientIp(req: Request) {
  const xff = req.headers.get("x-forwarded-for");
  if (!xff) return undefined;
  // can be "ip, ip, ip" — take first
  return xff.split(",")[0]?.trim() || undefined;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim();
    const subject = String(body.subject ?? "").trim();
    const message = String(body.message ?? "").trim();
    const website = String(body.website ?? "").trim(); // honeypot

    // spam bots: pretend success
    if (website) return NextResponse.json({ ok: true });

    // basic validation
    if (!name || !email || !subject || !message) {
      return NextResponse.json({ ok: false, error: "Missing fields" }, { status: 400 });
    }
    if (!isEmail(email)) {
      return NextResponse.json({ ok: false, error: "Invalid email" }, { status: 400 });
    }

    // safety limits (prevents giant payload spam)
    if (name.length > 120 || subject.length > 200 || message.length > 5000) {
      return NextResponse.json({ ok: false, error: "Too long" }, { status: 400 });
    }

    await notifyOwnerContactMessage({
      name,
      email,
      subject,
      message,
      meta: {
        ip: getClientIp(req),
        userAgent: req.headers.get("user-agent") ?? undefined,
        sentAt: new Date().toISOString(),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[contact] route error:", err);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
