import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

function safeDays(days: unknown) {
  if (!Array.isArray(days)) return [];
  return days
    .map((x) => Number(x))
    .filter((n) => Number.isInteger(n) && n >= 0 && n <= 6);
}

export async function GET(req: NextRequest) {
  const businessSlug = req.nextUrl.searchParams.get("businessSlug")?.trim();
  const staffId = req.nextUrl.searchParams.get("staffId")?.trim() || null;

  if (!businessSlug) {
    return NextResponse.json(
      { error: "Missing businessSlug" },
      { status: 400 },
    );
  }

  const business = await prisma.business.findUnique({
    where: { slug: businessSlug },
    select: {
      id: true,
      staff: {
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          title: true,
          avatarUrl: true,
          services: {
            select: { id: true },
          },
        },
      },
    },
  });

  if (!business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  // Look for specialist-specific rule if staffId was requested
  let ar = null;
  if (staffId) {
    ar = await prisma.availabilityRule.findFirst({
      where: {
        businessId: business.id,
        staffId,
      },
    });
  }

  // Fall back to business default rule (staffId: null)
  if (!ar) {
    ar = await prisma.availabilityRule.findFirst({
      where: {
        businessId: business.id,
        staffId: null,
      },
    });
  }

  // If no business rule has staffId: null, pick the first available rule
  if (!ar) {
    ar = await prisma.availabilityRule.findFirst({
      where: { businessId: business.id },
    });
  }

  if (!ar) {
    return NextResponse.json({
      rule: null,
      staff: business.staff,
    });
  }

  let days: number[] = [];
  try {
    days = safeDays(JSON.parse(ar.daysJson ?? "[]"));
  } catch {}

  return NextResponse.json({
    rule: {
      staffId: ar.staffId,
      timezone: ar.timezone,
      days,
      start: ar.start,
      end: ar.end,
      breakStart: ar.breakStart,
      breakEnd: ar.breakEnd,
      bufferMin: ar.bufferMin,
      slotStepMin: ar.slotStepMin,
    },
    staff: business.staff,
  });
}
