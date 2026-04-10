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

  if (!endpoint) {
    return json({ error: "Endpoint is required." }, 400);
  }

  await prisma.pushSubscription.deleteMany({
    where: {
      businessId: authed.id,
      endpoint
    }
  });

  return json({ ok: true });
}