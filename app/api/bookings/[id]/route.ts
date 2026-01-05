import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  const booking = await prisma.booking.findUnique({
    where: { id },
    select: {
      id: true,
      startsAt: true,
      durationMin: true,
      serviceName: true,
      price: true,
      currency: true,
      customerName: true,
      status: true,
      business: {
        select: {
          name: true,
          slug: true,
          category: true,
          city: true,
          country: true,
          website: true,
        },
      },
    },
  });

  if (!booking || booking.status !== "CONFIRMED") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    booking: {
      ...booking,
      startsAt: booking.startsAt.toISOString(),
    },
  });
}

