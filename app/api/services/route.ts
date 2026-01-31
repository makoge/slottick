import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthedBusiness } from "@/lib/auth";

type DepositType = "PERCENT" | "AMOUNT";

/** Keep this list in sync with your dashboard dropdown. */
const SERVICE_CATEGORY_OPTIONS = [
  "Hair",
  "Barber",
  "Lash",
  "Brows",
  "Nails",
  "Manicure",
  "Pedicure",
  "Makeup",
  "Skincare",
  "Massage",
  "Tattoo",
  "Waxing",
  "Facial",
  "Other"
] as const;

type ServiceCategory = (typeof SERVICE_CATEGORY_OPTIONS)[number];

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

function toPositiveInt(x: unknown, fallback = 0) {
  const n = Number(x);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.floor(n));
}

function toServiceCategory(x: unknown): ServiceCategory {
  const s = String(x ?? "").trim();
  const hit = SERVICE_CATEGORY_OPTIONS.find((c) => c === s);
  return hit ?? "Other";
}

function isSafeImageUrl(u: string) {
  const url = u.trim();
  if (!url) return false;
  if (url.startsWith("/")) return true;
  return /^https?:\/\//i.test(url);
}

function normalizeImageUrls(raw: unknown) {
  const arr = Array.isArray(raw) ? raw : [];
  const cleaned = arr.map((x) => String(x ?? "").trim()).filter(isSafeImageUrl);
  return Array.from(new Set(cleaned)).slice(0, 12);
}

type NormalizedService = {
  id: string;
  name: string;
  category: ServiceCategory; // ✅ NEW
  durationMin: number;
  price: number;
  currency: string;
  depositEnabled: boolean;
  depositType: DepositType;
  depositValue: number | null;
  imageUrls: string[];
};

function normalizeServices(raw: unknown): NormalizedService[] {
  const arr = Array.isArray(raw) ? raw : [];

  return arr
    .map((s: any) => {
      const id = String(s?.id ?? "").trim();
      const name = String(s?.name ?? "").trim();
      const category = toServiceCategory(s?.category); // ✅ NEW

      const durationMin = Math.max(5, toPositiveInt(s?.durationMin, 0));
      const price = Math.max(0, toPositiveInt(s?.price, 0));
      const currency = toCurrency(s?.currency);

      const depositEnabled = toBool(s?.depositEnabled);
      const depositType: DepositType = depositEnabled
        ? toDepositType(s?.depositType)
        : "PERCENT";

      let depositValue: number | null = null;
      if (depositEnabled) {
        const v = toPositiveInt(s?.depositValue, 0);
        depositValue =
          depositType === "PERCENT"
            ? Math.max(1, Math.min(100, v))
            : Math.max(1, Math.min(1_000_000, v));
      }

      // accept either `images` or `imageUrls` from client
      const imageUrls = normalizeImageUrls(s?.images ?? s?.imageUrls);

      return {
        id,
        name,
        category,
        durationMin,
        price,
        currency,
        depositEnabled,
        depositType,
        depositValue,
        imageUrls
      };
    })
    .filter((s) => s.id && s.name && s.durationMin > 0);
}

// GET: public by slug OR owner by session
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const businessSlug = searchParams.get("businessSlug");

  let businessId: string | null = null;

  if (businessSlug) {
    const biz = await prisma.business.findUnique({
      where: { slug: businessSlug },
      select: { id: true }
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
    select: {
      id: true,
      name: true,
      category: true, // ✅ NEW
      durationMin: true,
      price: true,
      currency: true,
      depositEnabled: true,
      depositType: true,
      depositValue: true,
      images: { select: { url: true }, orderBy: { sort: "asc" } }
    }
  });

  const mapped = services.map((s) => ({
    id: s.id,
    name: s.name,
    category: toServiceCategory(s.category), // ✅ normalize for safety
    durationMin: s.durationMin,
    price: s.price,
    currency: s.currency,
    depositEnabled: s.depositEnabled,
    depositType: s.depositType,
    depositValue: s.depositValue,
    images: s.images.map((i) => i.url)
  }));

  return NextResponse.json({ services: mapped });
}

// PUT: owner-only, replaces all services + images
export async function PUT(req: Request) {
  const business = await getAuthedBusiness();
  if (!business) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const next = normalizeServices(body.services);

  const saved = await prisma.$transaction(async (tx) => {
    // delete images then services (avoid FK issues)
    await tx.serviceImage.deleteMany({
      where: { service: { businessId: business.id } }
    });
    await tx.service.deleteMany({ where: { businessId: business.id } });

    if (next.length === 0) return [];

    for (const s of next) {
      await tx.service.create({
        data: {
          id: s.id,
          businessId: business.id,
          name: s.name,
          category: s.category, // ✅ NEW
          durationMin: s.durationMin,
          price: s.price,
          currency: s.currency,
          depositEnabled: s.depositEnabled,
          depositType: s.depositType,
          depositValue: s.depositValue ?? undefined,
          images: {
            create: s.imageUrls.map((url, idx) => ({
              url,
              sort: idx
            }))
          }
        }
      });
    }

    const services = await tx.service.findMany({
      where: { businessId: business.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        category: true, // ✅ NEW
        durationMin: true,
        price: true,
        currency: true,
        depositEnabled: true,
        depositType: true,
        depositValue: true,
        images: { select: { url: true }, orderBy: { sort: "asc" } }
      }
    });

    return services.map((s) => ({
      id: s.id,
      name: s.name,
      category: toServiceCategory(s.category),
      durationMin: s.durationMin,
      price: s.price,
      currency: s.currency,
      depositEnabled: s.depositEnabled,
      depositType: s.depositType,
      depositValue: s.depositValue,
      images: s.images.map((i) => i.url)
    }));
  });

  return NextResponse.json({ services: saved });
}

