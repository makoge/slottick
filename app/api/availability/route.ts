import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthedBusiness } from "@/lib/auth";
import { hasValidOrigin } from "@/lib/request-security";

export const runtime = "nodejs";

function safeDays(days: unknown) {
  if (!Array.isArray(days)) return [];
  return days
    .map((x) => Number(x))
    .filter((n) => Number.isInteger(n) && n >= 0 && n <= 6);
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const businessSlug = url.searchParams.get("businessSlug")?.trim() || null;
  const staffId = url.searchParams.get("staffId")?.trim() || null;

  let targetBusinessId: string | null = null;
  let allStaff: Array<{
    id: string;
    name: string;
    title: string | null;
    avatarUrl: string | null;
  }> = [];

  if (businessSlug) {
    // 1. Public client booking flow: find business by slug
    const pubBiz = await prisma.business.findUnique({
      where: { slug: businessSlug },
      select: {
        id: true,
        staff: {
          select: {
            id: true,
            name: true,
            title: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!pubBiz) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 },
      );
    }

    targetBusinessId = pubBiz.id;
    allStaff = pubBiz.staff;
  } else {
    // 2. Dashboard / Admin flow: require session
    const business = await getAuthedBusiness();
    if (!business) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    targetBusinessId = business.id;

    const staffList = await prisma.staff.findMany({
      where: { businessId: business.id },
      select: {
        id: true,
        name: true,
        title: true,
        avatarUrl: true,
      },
    });
    allStaff = staffList;
  }

  // Find staff-specific rule if staffId provided, else default business rule (staffId: null)
  let ar = await prisma.availabilityRule.findFirst({
    where: {
      businessId: targetBusinessId,
      staffId: staffId || null,
    },
  });

  // If a staffId was requested but has no custom schedule, fall back to business default
  if (!ar && staffId) {
    ar = await prisma.availabilityRule.findFirst({
      where: {
        businessId: targetBusinessId,
        staffId: null,
      },
    });
  }

  let days: number[] = [];
  if (ar) {
    try {
      days = safeDays(JSON.parse(ar.daysJson ?? "[]"));
    } catch {}
  }

  return NextResponse.json({
    rule: ar
      ? {
          id: ar.id,
          staffId: ar.staffId,
          timezone: ar.timezone,
          days,
          start: ar.start,
          end: ar.end,
          breakStart: ar.breakStart,
          breakEnd: ar.breakEnd,
          bufferMin: ar.bufferMin,
          slotStepMin: ar.slotStepMin,
        }
      : null,
    staff: allStaff, // Also supplies staff roster expected by booking-client
  });
}

export async function POST(req: NextRequest) {
  if (!hasValidOrigin(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const business = await getAuthedBusiness();
  if (!business)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const rule = body?.rule;
  if (!rule)
    return NextResponse.json({ error: "Missing rule" }, { status: 400 });

  const staffId = body?.staffId ? String(body.staffId).trim() : null;

  // Verify staff belongs to business if a staffId is specified
  if (staffId) {
    const validStaff = await prisma.staff.findFirst({
      where: { id: staffId, businessId: business.id },
      select: { id: true },
    });
    if (!validStaff) {
      return NextResponse.json(
        { error: "Specialist not found" },
        { status: 404 },
      );
    }
  }

  // Look up existing rule for target scope (staff-override or shop-wide default)
  const existingRule = await prisma.availabilityRule.findFirst({
    where: {
      businessId: business.id,
      staffId: staffId || null,
    },
    select: { id: true },
  });

  const ruleData = {
    businessId: business.id,
    staffId: staffId || null,
    timezone: String(rule.timezone ?? "UTC"),
    daysJson: JSON.stringify(safeDays(rule.days)),
    start: String(rule.start ?? "10:00"),
    end: String(rule.end ?? "18:00"),
    breakStart: rule.breakStart ? String(rule.breakStart) : null,
    breakEnd: rule.breakEnd ? String(rule.breakEnd) : null,
    bufferMin: Number(rule.bufferMin ?? 0),
    slotStepMin: Number(rule.slotStepMin ?? 30),
  };

  if (existingRule) {
    await prisma.availabilityRule.update({
      where: { id: existingRule.id },
      data: ruleData,
    });
  } else {
    await prisma.availabilityRule.create({
      data: ruleData,
    });
  }

  return NextResponse.json({ ok: true });
}
