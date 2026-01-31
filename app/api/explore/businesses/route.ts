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

  // allow "Massage" or "massage" -> MASSAGE (enum)
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

  const businesses = await prisma.business.findMany({
    where: {
      ...(city ? { city } : {}),
      ...(country ? { country } : {}),
      services: {
        some: categoryEnum ? { category: categoryEnum } : {},
      },
    },
    orderBy: { createdAt: "desc" },
    take: 24,
    select: {
      slug: true,
      name: true,
      industry: true,
      city: true,
      country: true,
      website: true,
      logoUrl: true,
      heroTag: true,
      ratingAvg: true,
      ratingCount: true,
      services: {
        // return categories for SEO/UI
        select: { category: true },
        distinct: ["category"],
      },
    },
  });

  return NextResponse.json({
    businesses: businesses.map((b) => ({
      slug: b.slug,
      name: b.name,
      industry: b.industry,
      city: b.city,
      country: b.country,
      website: b.website,
      logoUrl: b.logoUrl,
      heroTag: b.heroTag,
      ratingAvg: b.ratingAvg,
      ratingCount: b.ratingCount,
      categories: b.services.map((s) => s.category), // ✅ service categories
    })),
  });
}
