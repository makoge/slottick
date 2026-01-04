import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthedBusiness } from "@/lib/auth";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const business = await getAuthedBusiness();
  if (!business) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = String(params.id || "");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const booking = await prisma.booking.findUnique({
    where: { id },
    select: { id: true, businessId: true, status: true }
  });

  if (!booking || booking.businessId !== business.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (booking.status === "CANCELLED") return NextResponse.json({ ok: true });

  await prisma.booking.update({
    where: { id },
    data: { status: "CANCELLED" }
  });

  return NextResponse.json({ ok: true });
}
