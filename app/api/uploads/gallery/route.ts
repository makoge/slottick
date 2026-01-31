import { NextResponse } from "next/server";
import { getAuthedBusiness } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { put } from "@vercel/blob";
import crypto from "crypto";

export const runtime = "nodejs";

function json(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

const MAX_IMAGES = 12;
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

export async function GET() {
  const authed = await getAuthedBusiness();
  if (!authed) return json({ error: "Unauthorized" }, 401);

  const images = await prisma.businessImage.findMany({
    where: { businessId: authed.id },
    orderBy: [{ sort: "asc" }, { createdAt: "asc" }],
    select: { id: true, url: true, sort: true, createdAt: true }
  });

  return json({ images });
}

// Upload one image (FormData: file)
export async function POST(req: Request) {
  const authed = await getAuthedBusiness();
  if (!authed) return json({ error: "Unauthorized" }, 401);

  try {
    // ✅ enforce max images
    const count = await prisma.businessImage.count({
      where: { businessId: authed.id }
    });
    if (count >= MAX_IMAGES) {
      return json({ error: `Max ${MAX_IMAGES} images allowed.` }, 400);
    }

    const form = await req.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return json({ error: "No file uploaded" }, 400);
    }

    if (file.size > MAX_BYTES) {
      return json({ error: "Max file size is 5MB" }, 400);
    }

    if (!ALLOWED.includes(file.type)) {
      return json({ error: "Unsupported file type" }, 400);
    }

    const ext = file.type.split("/")[1] || "png";
    const key = `booking-gallery/${authed.slug}/${crypto.randomUUID()}.${ext}`;

    const blob = await put(key, file, {
      access: "public",
      addRandomSuffix: false
    });

    const last = await prisma.businessImage.findFirst({
      where: { businessId: authed.id },
      orderBy: { sort: "desc" },
      select: { sort: true }
    });

    const created = await prisma.businessImage.create({
      data: {
        businessId: authed.id,
        url: blob.url,
        sort: (last?.sort ?? -1) + 1
      },
      select: { id: true, url: true, sort: true, createdAt: true }
    });

    return json({ image: created });
  } catch (err) {
    console.error("Gallery upload failed:", err);
    return json({ error: "Upload failed" }, 500);
  }
}

// Reorder: body { order: string[] }
export async function PATCH(req: Request) {
  const authed = await getAuthedBusiness();
  if (!authed) return json({ error: "Unauthorized" }, 401);

  const body = await req.json().catch(() => ({}));
  const order: string[] = Array.isArray(body.order) ? body.order.map(String) : [];

  if (!order.length) return json({ error: "Missing order" }, 400);

  const rows = await prisma.businessImage.findMany({
    where: { businessId: authed.id, id: { in: order } },
    select: { id: true }
  });

  const allowed = new Set(rows.map((r) => r.id));
  const filtered = order.filter((id) => allowed.has(id));

  // ✅ important: prevent empty transaction
  if (!filtered.length) {
    return json({ error: "Invalid order ids" }, 400);
  }

  await prisma.$transaction(
    filtered.map((id, idx) =>
      prisma.businessImage.update({
        where: { id },
        data: { sort: idx }
      })
    )
  );

  const images = await prisma.businessImage.findMany({
    where: { businessId: authed.id },
    orderBy: [{ sort: "asc" }, { createdAt: "asc" }],
    select: { id: true, url: true, sort: true, createdAt: true }
  });

  return json({ images });
}

// Delete: /api/uploads/gallery?id=...
export async function DELETE(req: Request) {
  const authed = await getAuthedBusiness();
  if (!authed) return json({ error: "Unauthorized" }, 401);

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return json({ error: "Missing id" }, 400);

  const existing = await prisma.businessImage.findFirst({
    where: { id, businessId: authed.id },
    select: { id: true }
  });

  if (!existing) return json({ error: "Not found" }, 404);

  await prisma.businessImage.delete({ where: { id } });

  const images = await prisma.businessImage.findMany({
    where: { businessId: authed.id },
    orderBy: [{ sort: "asc" }, { createdAt: "asc" }],
    select: { id: true, url: true, sort: true, createdAt: true }
  });

  return json({ images });
}
