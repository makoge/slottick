import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthedBusiness } from "@/lib/auth";

export const runtime = "nodejs";

function safeDays(days: unknown) {
  if (!Array.isArray(days)) return [];
  return days
    .map((x) => Number(x))
    .filter((n) => Number.isInteger(n) && n >= 0 && n <= 6);
}

export async function GET() {
  const business = await getAuthedBusiness();
  if (!business) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ar = await prisma.availabilityRule.findUnique({
    where: { businessId: business.id },
  });

  if (!ar) return NextResponse.json({ rule: null });

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
      slotStepMin: ar.slotStepMin,
    },
  });
}

export async function POST(req: NextRequest) {
  const business = await getAuthedBusiness();
  if (!business) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const rule = body?.rule;
  if (!rule) return NextResponse.json({ error: "Missing rule" }, { status: 400 });

  await prisma.availabilityRule.upsert({
    where: { businessId: business.id },
    create: {
      businessId: business.id,
      timezone: String(rule.timezone ?? "UTC"),
      daysJson: JSON.stringify(safeDays(rule.days)),
      start: String(rule.start ?? "10:00"),
      end: String(rule.end ?? "18:00"),
      breakStart: rule.breakStart ? String(rule.breakStart) : null,
      breakEnd: rule.breakEnd ? String(rule.breakEnd) : null,
      bufferMin: Number(rule.bufferMin ?? 0),
      slotStepMin: Number(rule.slotStepMin ?? 30),
    },
    update: {
      timezone: String(rule.timezone ?? "UTC"),
      daysJson: JSON.stringify(safeDays(rule.days)),
      start: String(rule.start ?? "10:00"),
      end: String(rule.end ?? "18:00"),
      breakStart: rule.breakStart ? String(rule.breakStart) : null,
      breakEnd: rule.breakEnd ? String(rule.breakEnd) : null,
      bufferMin: Number(rule.bufferMin ?? 0),
      slotStepMin: Number(rule.slotStepMin ?? 30),
    },
  });

  return NextResponse.json({ ok: true });
}
