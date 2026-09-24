import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ServiceCategory } from "@prisma/client";

export const runtime = "nodejs";

function normalize(s: unknown) {
  return String(s ?? "").trim();
}

function toServiceCategory(input: unknown): ServiceCategory | undefined {
  const raw = normalize(input).toUpperCase();
  if (!raw) return undefined;

  const mapped = raw.replace(/[^A-Z_]/g, "_");
  return Object.values(ServiceCategory).includes(mapped as ServiceCategory)
    ? (mapped as ServiceCategory)
    : undefined;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const city = normalize(searchParams.get("city"));
  const country = normalize(searchParams.get("country")).toUpperCase();
  const categoryEnum = toServiceCategory(searchParams.get("category"));
  const query = normalize(searchParams.get("q"));

  const businesses = await prisma.business.findMany({
    where: {
      subscriptionStatus: { in: ["ACTIVE", "TRIALING"] },
      ...(country ? { country } : {}),
      ...(city
        ? {
            city: {
              equals: city,
              mode: "insensitive",
            },
          }
        : {}),
      ...(query
        ? {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { city: { contains: query, mode: "insensitive" } },
              { description: { contains: query, mode: "insensitive" } },
              {
                services: {
                  some: {
                    name: { contains: query, mode: "insensitive" },
                  },
                },
              },
            ],
          }
        : {}),
      services: {
        some: categoryEnum ? { category: categoryEnum } : {},
      },
    },
    orderBy: [
      { ratingAvg: "desc" },
      { ratingCount: "desc" },
      { createdAt: "desc" },
    ],
    take: 24,
    select: {
      slug: true,
      name: true,
      industry: true,
      city: true,
      country: true,
      street: true,
      website: true,
      logoUrl: true,
      heroTag: true,
      ratingAvg: true,
      ratingCount: true,
      staff: {
        where: { isActive: true },
        take: 4,
        select: {
          id: true,
          name: true,
          title: true,
          avatarUrl: true,
        },
      },
      _count: {
        select: {
          staff: { where: { isActive: true } },
          services: true,
        },
      },
      services: {
        select: {
          category: true,
          price: true,
          currency: true,
        },
      },
    },
  });

  return NextResponse.json({
    businesses: businesses.map((b) => {
      // Find starting price and unique categories
      const prices = b.services.map((s) => s.price).filter((p) => p > 0);
      const minPrice = prices.length > 0 ? Math.min(...prices) : null;
      const currency = b.services[0]?.currency || "EUR";
      const categories = Array.from(new Set(b.services.map((s) => s.category)));

      return {
        slug: b.slug,
        name: b.name,
        industry: b.industry,
        city: b.city,
        country: b.country,
        street: b.street,
        website: b.website,
        logoUrl: b.logoUrl,
        heroTag: b.heroTag,
        ratingAvg: b.ratingAvg,
        ratingCount: b.ratingCount,
        categories,
        startingPrice: minPrice,
        currency,
        staffCount: b._count.staff,
        servicesCount: b._count.services,
        teamPreview: b.staff,
      };
    }),
  });
}
