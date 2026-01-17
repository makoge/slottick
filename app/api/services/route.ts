import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthedBusiness } from "@/lib/auth";

type DepositType = "PERCENT" | "AMOUNT";

function toCurrency(x: unknown) {
  const s = String(x ?? "EUR").toUpperCase();
  return s === "USD" || s === "EUR" || s === "FCFA" ? s : "EUR";
}

function toDepositType(x: unknown): DepositType {
  const s = String(x ?? "PERCENT").toUpperCase();
  return s === "AMOUNT" ? "AMOUNT" : "PERCENT";
}

function toBool(x: unknown) {
  return x === true || x === "true" || x === 1 || x === "1";
}

function toPositiveNumber(x: unknown, fallback = 0) {
  const n = Number(x);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, n);
}

function normalizeServices(raw: unknown) {
  const arr = Array.isArray(raw) ? raw : [];

  return arr
    .map((s: any) => {
      const currency = toCurrency(s?.currency);
      const depositEnabled = toBool(s?.depositEnabled);
      const depositType = toDepositType(s?.depositType);

      let depositValue: number | null = null;

      if (depositEnabled) {
        const v = toPositiveNumber(s?.depositValue, 0);

        if (depositType === "PERCENT") {
          // 1..100
          depositValue = Math.max(1, Math.min(100, Math.floor(v)));
        } else {
          // AMOUNT >= 1 (currency units)
          depositValue = Math.max(1, Math.floor(v));
        }

        if (!depositValue) depositValue = null;
      }

      return {
        name: String(s?.name ?? "").trim(),
        durationMin: Math.max(5, Number(s?.durationMin ?? 0) || 0),
        price: Math.max(0, Number(s?.price ?? 0) || 0),
        currency,

        // NEW
        depositEnabled,
        depositType,
        depositValue, // null when disabled
      };
    })
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
    if (!authed) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    businessId = authed.id;
  }

  const services = await prisma.service.findMany({
    where: { businessId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      durationMin: true,
      price: true,
      currency: true,

      // NEW
      depositEnabled: true,
      depositType: true,
      depositValue: true,
    },
  });

  return NextResponse.json({ services });
}

// ✅ PUT is owner-only (cookie session) and replaces all services
export async function PUT(req: Request) {
  const business = await getAuthedBusiness();
  if (!business) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const next = normalizeServices(body.services);

  const created = await prisma.$transaction(async (tx) => {
    await tx.service.deleteMany({ where: { businessId: business.id } });

    if (next.length === 0) return [];

    await tx.service.createMany({
      data: next.map((s) => ({
        ...s,
        businessId: business.id,
      })),
    });

    return tx.service.findMany({
      where: { businessId: business.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        durationMin: true,
        price: true,
        currency: true,

        // NEW
        depositEnabled: true,
        depositType: true,
        depositValue: true,
      },
    });
  });

  return NextResponse.json({ services: created });
}
