import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

// Public read: booking success page only (safe fields)
export async function GET(_req: Request, ctx: { params: { id: string } }) {
  const id = String(ctx.params.id || "").trim();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

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
          website: true
        }
      }
    }
  });

  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Don’t show cancelled bookings as “success”
  if (booking.status !== "CONFIRMED") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    booking: {
      ...booking,
      startsAt: booking.startsAt.toISOString()
    }
  });
}
