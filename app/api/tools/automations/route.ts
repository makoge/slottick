import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthedBusiness } from "@/lib/auth";
import { sendClientFollowUpEmail } from "@/lib/email";

function isEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function renderTemplate(
  body: string,
  client: { name?: string | null; email?: string | null }
) {
  const first = client.name?.trim()?.split(/\s+/)?.[0] ?? "";
  const map: Record<string, string> = {
    "{name}": client.name ?? "",
    "{firstName}": first,
    "{email}": client.email ?? "",
  };

  let out = body;
  for (const k of Object.keys(map)) out = out.split(k).join(map[k]);
  return out;
}

export async function POST(req: Request) {
  const business = await getAuthedBusiness();
  if (!business) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    const name = String(body.name ?? "").trim();
    const trigger = body.trigger ?? {};
    const template = body.template ?? {};
    const audience = body.audience ?? {};
    const client = body.client ?? null;

    const subject = String(template.subject ?? "").trim();
    const rawBody = String(template.body ?? "").trim();

    if (!name || !subject || !rawBody) {
      return NextResponse.json(
        { error: "Missing name, subject, or body" },
        { status: 400 }
      );
    }

    if (!client || !client.email || !isEmail(String(client.email))) {
      return NextResponse.json(
        { error: "A valid client email is required" },
        { status: 400 }
      );
    }

    // Save automation (for history / dashboard)
    const automation = await prisma.automation.create({
      data: {
        businessId: business.id,
        name,
        triggerJson: JSON.stringify(trigger),
        templateJson: JSON.stringify(template),
        audienceJson: JSON.stringify(audience),
      },
    });

    let scheduledAt: string | undefined;

    if (trigger.type === "customDate" && trigger.sendAt) {
      const d = new Date(trigger.sendAt);
      if (Number.isNaN(d.getTime())) {
        return NextResponse.json(
          { error: "Invalid sendAt date" },
          { status: 400 }
        );
      }

      scheduledAt = d.toISOString();
    }

    const renderedSubject = renderTemplate(subject, client);
    const renderedBody = renderTemplate(rawBody, client).replace(/\n/g, "<br/>");

    // Schedule email with Resend
    const res = await sendClientFollowUpEmail({
      to: String(client.email).trim(),
      subject: renderedSubject,
      html: renderedBody,
      scheduledAt, // if undefined it sends immediately
    });

    if (!res?.ok) {
      return NextResponse.json(
        { error: "Failed to schedule email" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      automation,
      scheduled: scheduledAt ?? "sent immediately",
    });
  } catch (err) {
    console.error("[tools/automations] POST error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}