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

  if (!businessSlug) {
    return NextResponse.json({ error: "Missing businessSlug" }, { status: 400 });
  }

  const business = await prisma.business.findUnique({
    where: { slug: businessSlug },
    select: { id: true }
  });

  if (!business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  const ar = await prisma.availabilityRule.findUnique({
    where: { businessId: business.id }
  });

  if (!ar) {
    return NextResponse.json({ rule: null });
  }

  let days: number[] = [];
  try {
    days = safeDays(JSON.parse(ar.daysJson ?? "[]"));
  } catch {}

  return NextResponse.json({
    rule: {
      timezone: ar.timezone,
      days,
      start: ar.start,
      end: ar.end,
      breakStart: ar.breakStart,
      breakEnd: ar.breakEnd,
      bufferMin: ar.bufferMin,
      slotStepMin: ar.slotStepMin
    }
  });
}