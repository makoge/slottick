import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthedBusiness } from "@/lib/auth";

function isEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function renderTemplate(body: string, client: {
  name?: string | null;
  email?: string | null;
}) {
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
      return NextResponse.json({ error: "Missing name, subject, or body" }, { status: 400 });
    }

    if (!client || !client.email || !isEmail(String(client.email))) {
      return NextResponse.json({ error: "A valid client email is required" }, { status: 400 });
    }

    const automation = await prisma.automation.create({
      data: {
        businessId: business.id,
        name,
        triggerJson: JSON.stringify(trigger),
        templateJson: JSON.stringify(template),
        audienceJson: JSON.stringify(audience),
      },
    });

    let sendAt: Date;

    if (trigger.type === "customDate" && trigger.sendAt) {
      sendAt = new Date(trigger.sendAt);
    } else {
      // fallback for now so you can test it
      sendAt = new Date(Date.now() + 60 * 1000);
    }

    if (Number.isNaN(sendAt.getTime())) {
      return NextResponse.json({ error: "Invalid sendAt date" }, { status: 400 });
    }

    const renderedSubject = renderTemplate(subject, client);
    const renderedBody = renderTemplate(rawBody, client).replace(/\n/g, "<br/>");

    const workspace = await prisma.marketingWorkspace.upsert({
  where: { businessId: business.id },
  update: {},
  create: {
    businessId: business.id,
    name: business.name,
  },
});

    const scheduledMessage = await prisma.scheduledMessage.create({
  data: {
    business: {
      connect: { id: business.id },
    },
    workspace: {
      connect: { id: workspace.id },
    },
    automation: {
      connect: { id: automation.id },
    },

    channel: "email",
    to: String(client.email).trim(),
    subject: renderedSubject,
    html: renderedBody,
    sendAt,
    status: "scheduled",
  },
});
    return NextResponse.json({
      ok: true,
      automation,
      scheduledMessage,
    });
  } catch (err) {
    console.error("[tools/automations] POST error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}