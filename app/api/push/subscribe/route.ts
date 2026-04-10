import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthedBusiness } from "@/lib/auth";
import { hasValidOrigin } from "@/lib/request-security";

export const runtime = "nodejs";

function json(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

function asString(v: unknown) {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

export async function POST(req: Request) {
  if (!hasValidOrigin(req)) {
    return json({ error: "Forbidden" }, 403);
  }

  const authed = await getAuthedBusiness();
  if (!authed) return json({ error: "Unauthorized" }, 401);

  const body = await req.json().catch(() => ({}));
  const endpoint = asString(body?.endpoint).trim();
  const p256dh = asString(body?.keys?.p256dh).trim();
  const auth = asString(body?.keys?.auth).trim();
  const userAgent = asString(body?.userAgent).trim() || null;

  if (!endpoint || !p256dh || !auth) {
    return json({ error: "Invalid subscription payload." }, 400);
  }

  const sub = await prisma.pushSubscription.upsert({
    where: { endpoint },
    update: {
      businessId: authed.id,
      p256dh,
      auth,
      userAgent
    },
    create: {
      businessId: authed.id,
      endpoint,
      p256dh,
      auth,
      userAgent
    }
  });

  return json({ ok: true, subscriptionId: sub.id });
}