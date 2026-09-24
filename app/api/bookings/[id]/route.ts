import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  if (!id) {
    return NextResponse.json({ error: "Missing booking id" }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({
    where: { id },
    select: {
      id: true,
      startsAt: true,
      endsAt: true,
      durationMin: true,
      serviceName: true,
      price: true,
      currency: true,
      customerName: true,
      status: true,
      depositPaid: true,
      depositAmount: true,
      paymentStatus: true,
      staffId: true,
      staff: {
        select: {
          id: true,
          name: true,
          title: true,
          avatarUrl: true,
        },
      },
      items: {
        select: {
          id: true,
          serviceName: true,
          durationMin: true,
          price: true,
        },
      },
      business: {
        select: {
          id: true,
          name: true,
          slug: true,
          industry: true,
          city: true,
          country: true,
          street: true,
          postalCode: true,
          website: true,
          logoUrl: true,
        },
      },
    },
  });

  // Allow CONFIRMED and PENDING bookings (for businesses with booking approval enabled)
  if (
    !booking ||
    (booking.status !== "CONFIRMED" && booking.status !== "PENDING")
  ) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    booking: {
      ...booking,
      startsAt: booking.startsAt.toISOString(),
      endsAt: booking.endsAt.toISOString(),
    },
  });
}
