import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const client = await prisma.clientProfile.findUnique({
      where: { id },
      include: {
        records: {
          orderBy: { date: "desc" },
          include: {
            staff: { select: { name: true, title: true } },
          },
        },
        photos: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    return NextResponse.json({ client });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to load client profile" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const client = await prisma.clientProfile.update({
      where: { id },
      data: {
        allergies: body.allergies?.trim() || null,
        generalNotes: body.generalNotes?.trim() || null,
        phone: body.phone?.trim() || null,
      },
    });

    return NextResponse.json({ client });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to update client" },
      { status: 500 },
    );
  }
}
