import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthedBusiness } from "@/lib/auth";

function toCurrency(x: unknown) {
  const s = String(x ?? "EUR").toUpperCase();
  return s === "USD" || s === "EUR" || s === "FCFA" ? s : "EUR";
}

function normalizeServices(raw: unknown) {
  const arr = Array.isArray(raw) ? raw : [];
  return arr
    .map((s: any) => ({
      name: String(s?.name ?? "").trim(),
      durationMin: Math.max(5, Number(s?.durationMin ?? 0) || 0),
      price: Math.max(0, Number(s?.price ?? 0) || 0),
      currency: toCurrency(s?.currency),
    }))
    .filter((s) => s.name && s.durationMin > 0);
}

// ✅ GET supports:
// - Public:   /api/services?businessSlug=abc
// - Owner:    /api/services  (cookie session)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const businessSlug = searchParams.get("businessSlug");

  let businessId: string | null = null;

  if (businessSlug) {
    const biz = await prisma.business.findUnique({
      where: { slug: businessSlug },
      select: { id: true },
    });
    if (!biz) return NextResponse.json({ services: [] });
    businessId = biz.id;
  } else {
    const authed = await getAuthedBusiness();
    if (!authed) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    businessId = authed.id;
  }

  const services = await prisma.service.findMany({
    where: { businessId },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, durationMin: true, price: true, currency: true },
  });

  return NextResponse.json({ services });
}

// ✅ PUT is owner-only (cookie session) and replaces all services
export async function PUT(req: Request) {
  const business = await getAuthedBusiness();
  if (!business) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const next = normalizeServices(body.services);

  const created = await prisma.$transaction(async (tx) => {
    await tx.service.deleteMany({ where: { businessId: business.id } });

    if (next.length === 0) return [];

    await tx.service.createMany({
      data: next.map((s) => ({ ...s, businessId: business.id })),
    });

    return tx.service.findMany({
      where: { businessId: business.id },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, durationMin: true, price: true, currency: true },
    });
  });

  return NextResponse.json({ services: created });
}
