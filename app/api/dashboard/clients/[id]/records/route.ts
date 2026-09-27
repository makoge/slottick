import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();

    if (!body.serviceName) {
      return NextResponse.json(
        { error: "Service name is required" },
        { status: 400 },
      );
    }

    const record = await prisma.clientVisitRecord.create({
      data: {
        clientProfileId: id,
        serviceName: body.serviceName.trim(),
        formulaNotes: body.formulaNotes?.trim() || null,
        internalNotes: body.internalNotes?.trim() || null,
        staffId: body.staffId || null,
        date: body.date ? new Date(body.date) : new Date(),
      },
      include: {
        staff: { select: { name: true, title: true } },
      },
    });

    return NextResponse.json({ record });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to create visit record" },
      { status: 500 },
    );
  }
}
