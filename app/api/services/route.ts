import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthedBusiness } from "@/lib/auth";

function normalizeCurrency(x: unknown) {
  const c = String(x ?? "EUR").toUpperCase();
  return c === "EUR" || c === "USD" || c === "FCFA" ? c : "EUR";
}

function cleanServices(input: unknown) {
  if (!Array.isArray(input)) return [];

  return input
    .map((s) => ({
      name: String((s as any)?.name ?? "").trim(),
      durationMin: Number((s as any)?.durationMin ?? 0),
      price: Number((s as any)?.price ?? 0),
      currency: normalizeCurrency((s as any)?.currency)
    }))
    .filter((s) => s.name && Number.isFinite(s.durationMin) && s.durationMin >= 5)
    .map((s) => ({
      ...s,
      durationMin: Math.max(5, Math.floor(s.durationMin)),
      price: Math.max(0, Math.floor(s.price))
    }));
}

export async function GET() {
  const business = await getAuthedBusiness();
  if (!business) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const services = await prisma.service.findMany({
    where: { businessId: business.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, durationMin: true, price: true, currency: true }
  });

  return NextResponse.json({ services });
}

export async function PUT(req: Request) {
  const business = await getAuthedBusiness();
  if (!business) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const next = cleanServices(body.services);

  // opinion: simplest MVP = replace-all
  const services = await prisma.$transaction(async (tx) => {
    await tx.service.deleteMany({ where: { businessId: business.id } });

    if (next.length === 0) return [];

    await tx.service.createMany({
      data: next.map((s) => ({ ...s, businessId: business.id }))
    });

    return tx.service.findMany({
      where: { businessId: business.id },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, durationMin: true, price: true, currency: true }
    });
  });

  return NextResponse.json({ ok: true, services });
}
