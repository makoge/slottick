import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthedBusiness } from "@/lib/auth";
import { ServiceCategory } from "@prisma/client";
import { hasValidOrigin } from "@/lib/request-security";
import { businessHasAccess } from "@/lib/subscription";

export const runtime = "nodejs";

type DepositType = "PERCENT" | "AMOUNT";

const SERVICE_CATEGORY_LABELS = [
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
  "Other",
] as const;

type ServiceCategoryLabel = (typeof SERVICE_CATEGORY_LABELS)[number];

const LABEL_TO_ENUM: Record<ServiceCategoryLabel, ServiceCategory> = {
  Hair: ServiceCategory.HAIR,
  Barber: ServiceCategory.BARBER,
  Lash: ServiceCategory.LASH,
  Brows: ServiceCategory.BROWS,
  Nails: ServiceCategory.NAILS,
  Manicure: ServiceCategory.NAILS,
  Pedicure: ServiceCategory.NAILS,
  Makeup: ServiceCategory.MAKEUP,
  Skincare: ServiceCategory.SKINCARE,
  Massage: ServiceCategory.MASSAGE,
  Tattoo: ServiceCategory.TATTOO,
  Waxing: ServiceCategory.OTHER,
  Facial: ServiceCategory.SKINCARE,
  Other: ServiceCategory.OTHER,
};

const ENUM_TO_LABEL: Record<ServiceCategory, ServiceCategoryLabel> = {
  LASH: "Lash",
  NAILS: "Nails",
  BROWS: "Brows",
  HAIR: "Hair",
  BARBER: "Barber",
  MASSAGE: "Massage",
  MAKEUP: "Makeup",
  SKINCARE: "Skincare",
  TATTOO: "Tattoo",
  FITNESS: "Other",
  OTHER: "Other",
};

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

function isSafeImageUrl(u: string) {
  const url = String(u ?? "").trim();
  if (!url) return false;
  if (url.startsWith("/")) return true;
  return /^https?:\/\//i.test(url);
}

function normalizeImageUrls(raw: unknown) {
  const arr = Array.isArray(raw) ? raw : [];
  const cleaned = arr.map((x) => String(x ?? "").trim()).filter(isSafeImageUrl);
  return Array.from(new Set(cleaned)).slice(0, 12);
}

function toServiceCategoryEnum(x: unknown): ServiceCategory {
  const raw = String(x ?? "").trim();
  if (!raw) return ServiceCategory.OTHER;

  if (Object.values(ServiceCategory).includes(raw as ServiceCategory)) {
    return raw as ServiceCategory;
  }

  const hit = SERVICE_CATEGORY_LABELS.find((c) => c === raw) as
    | ServiceCategoryLabel
    | undefined;
  if (hit) return LABEL_TO_ENUM[hit];

  return ServiceCategory.OTHER;
}

type NormalizedService = {
  id?: string;
  name: string;
  category: ServiceCategory;
  durationMin: number;
  price: number;
  currency: string;
  depositEnabled: boolean;
  depositType: DepositType;
  depositValue: number | null;
  imageUrls: string[];
  staffIds?: string[];
};

function normalizeServices(raw: unknown): NormalizedService[] {
  const arr = Array.isArray(raw) ? raw : [];

  return arr
    .map((s: any) => {
      const id = String(s?.id ?? "").trim() || undefined;
      const name = String(s?.name ?? "").trim();
      const category = toServiceCategoryEnum(s?.category);

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

      const imageUrls = normalizeImageUrls(s?.images ?? s?.imageUrls);
      const staffIds = Array.isArray(s?.staffIds)
        ? s.staffIds.map((id: unknown) => String(id).trim()).filter(Boolean)
        : undefined;

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
        imageUrls,
        staffIds,
      };
    })
    .filter((s) => s.name && s.durationMin > 0);
}

// GET: public by slug OR owner by session
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
    if (!authed)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    businessId = authed.id;
  }

  const services = await prisma.service.findMany({
    where: { businessId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      category: true,
      durationMin: true,
      price: true,
      currency: true,
      depositEnabled: true,
      depositType: true,
      depositValue: true,
      images: { select: { url: true }, orderBy: { sort: "asc" } },
      staff: {
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          title: true,
        },
      },
    },
  });

  const mapped = services.map((s) => ({
    id: s.id,
    name: s.name,
    category: ENUM_TO_LABEL[s.category] ?? "Other",
    durationMin: s.durationMin,
    price: s.price,
    currency: s.currency,
    depositEnabled: s.depositEnabled,
    depositType: s.depositType,
    depositValue: s.depositValue,
    images: s.images.map((i) => i.url),
    staff: s.staff,
  }));

  return NextResponse.json({ services: mapped });
}

// PUT: owner-only upsert of services, images, and staff linkages
export async function PUT(req: Request) {
  if (!hasValidOrigin(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const business = await getAuthedBusiness();
  if (!business)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!businessHasAccess(business)) {
    return NextResponse.json(
      {
        error: "Your free trial has ended. Please subscribe to continue.",
        code: "TRIAL_EXPIRED",
      },
      { status: 402 },
    );
  }

  const body = await req.json().catch(() => ({}));
  const next = normalizeServices(body.services);

  try {
    const saved = await prisma.$transaction(async (tx) => {
      // 1. Identify which services to keep vs. delete
      const incomingIds = next.map((s) => s.id).filter(Boolean) as string[];

      // Delete services omitted from the payload, but only if they don't have bookings
      if (incomingIds.length > 0) {
        const toDelete = await tx.service.findMany({
          where: {
            businessId: business.id,
            id: { notIn: incomingIds },
          },
          select: {
            id: true,
            _count: { select: { bookings: true, bookingItems: true } },
          },
        });

        for (const item of toDelete) {
          // If referenced by previous bookings, avoid crash: skip deletion or un-link
          if (item._count.bookings === 0 && item._count.bookingItems === 0) {
            await tx.serviceImage.deleteMany({ where: { serviceId: item.id } });
            await tx.service.delete({ where: { id: item.id } });
          }
        }
      }

      // 2. Upsert each service
      for (const s of next) {
        const baseData = {
          name: s.name,
          category: s.category,
          durationMin: s.durationMin,
          price: s.price,
          currency: s.currency,
          depositEnabled: s.depositEnabled,
          depositType: s.depositType,
          depositValue: s.depositValue ?? undefined,
        };

        const staffConnect = s.staffIds ? s.staffIds.map((id) => ({ id })) : [];

        let targetId = s.id;

        if (targetId) {
          await tx.service.upsert({
            where: { id: targetId },
            update: {
              ...baseData,
              staff: {
                set: staffConnect, // ✅ 'set' is valid for update
              },
            },
            create: {
              ...baseData,
              id: targetId,
              businessId: business.id,
              staff:
                staffConnect.length > 0 ? { connect: staffConnect } : undefined, // ✅ 'connect' for create
            },
          });
        } else {
          const created = await tx.service.create({
            data: {
              ...baseData,
              businessId: business.id,
              staff:
                staffConnect.length > 0 ? { connect: staffConnect } : undefined, // ✅ 'connect' for create
            },
          });
          targetId = created.id;
        }

        // Replace images for this service
        await tx.serviceImage.deleteMany({ where: { serviceId: targetId } });
        if (s.imageUrls.length > 0) {
          await tx.serviceImage.createMany({
            data: s.imageUrls.map((url, idx) => ({
              serviceId: targetId!,
              url,
              sort: idx,
            })),
          });
        }
      }

      // 3. Return updated list
      const services = await tx.service.findMany({
        where: { businessId: business.id },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          category: true,
          durationMin: true,
          price: true,
          currency: true,
          depositEnabled: true,
          depositType: true,
          depositValue: true,
          images: { select: { url: true }, orderBy: { sort: "asc" } },
          staff: {
            where: { isActive: true },
            select: {
              id: true,
              name: true,
              title: true,
            },
          },
        },
      });

      return services.map((s) => ({
        id: s.id,
        name: s.name,
        category: ENUM_TO_LABEL[s.category] ?? "Other",
        durationMin: s.durationMin,
        price: s.price,
        currency: s.currency,
        depositEnabled: s.depositEnabled,
        depositType: s.depositType,
        depositValue: s.depositValue,
        images: s.images.map((i) => i.url),
        staff: s.staff,
      }));
    });

    return NextResponse.json({ services: saved });
  } catch (err: any) {
    console.error("PUT /api/services failed:", err);
    return NextResponse.json(
      { error: err.message || "Failed to save services" },
      { status: 500 },
    );
  }
}
