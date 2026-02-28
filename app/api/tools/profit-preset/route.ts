import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthedBusiness } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  const business = await getAuthedBusiness();
  if (!business) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const preset = await prisma.profitCalculatorPreset.findUnique({
    where: { businessId: business.id },
  });

  if (!preset) return NextResponse.json({ preset: null });

  let products: unknown = [];
  try { products = JSON.parse(preset.productsJson ?? "[]"); } catch {}

  return NextResponse.json({
    preset: {
      currency: preset.currency,
      price: preset.price,
      minutes: preset.minutes,
      feePct: preset.feePct,
      taxPct: preset.taxPct,
      fixedMonthly: preset.fixedMonthly,
      apptsPerMonth: preset.apptsPerMonth,
      targetHourly: preset.targetHourly,
      products,
    },
  });
}

export async function PUT(req: Request) {
  const business = await getAuthedBusiness();
  if (!business) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Bad JSON" }, { status: 400 });

  const productsJson = JSON.stringify(Array.isArray(body.products) ? body.products : []);

  const preset = await prisma.profitCalculatorPreset.upsert({
    where: { businessId: business.id },
    create: {
      businessId: business.id,
      currency: String(body.currency ?? "EUR"),
      price: Number(body.price ?? 0),
      minutes: Number(body.minutes ?? 60),
      feePct: Number(body.feePct ?? 0),
      taxPct: Number(body.taxPct ?? 0),
      fixedMonthly: Number(body.fixedMonthly ?? 0),
      apptsPerMonth: Number(body.apptsPerMonth ?? 0),
      targetHourly: Number(body.targetHourly ?? 0),
      productsJson,
    },
    update: {
      currency: String(body.currency ?? "EUR"),
      price: Number(body.price ?? 0),
      minutes: Number(body.minutes ?? 60),
      feePct: Number(body.feePct ?? 0),
      taxPct: Number(body.taxPct ?? 0),
      fixedMonthly: Number(body.fixedMonthly ?? 0),
      apptsPerMonth: Number(body.apptsPerMonth ?? 0),
      targetHourly: Number(body.targetHourly ?? 0),
      productsJson,
    },
  });

  return NextResponse.json({ ok: true, updatedAt: preset.updatedAt });
}