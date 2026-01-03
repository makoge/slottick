import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: Request) {
  const body = await req.json();

  const name = String(body.name ?? "").trim();
  const category = String(body.category ?? "Other").trim();
  const city = String(body.city ?? "").trim();
  const country = String(body.country ?? "").trim();
  const website = body.website ? String(body.website).trim() : null;

  const ownerEmail = String(body.ownerEmail ?? "").trim().toLowerCase();
  const ownerPassword = String(body.ownerPassword ?? "");

  if (!name || !city || !country || !ownerEmail || !ownerPassword) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  if (!isValidEmail(ownerEmail)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  if (ownerPassword.length < 6) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters" },
      { status: 400 }
    );
  }

  // Ensure unique email
  const emailExists = await prisma.business.findUnique({
    where: { ownerEmail }
  });
  if (emailExists) {
    return NextResponse.json(
      { error: "An account with this email already exists. Please log in." },
      { status: 409 }
    );
  }

  const baseSlug = slugify(body.slug ?? name) || "business";
  let slug = baseSlug;

  // ensure unique slug
  for (let i = 0; i < 10; i++) {
    const exists = await prisma.business.findUnique({ where: { slug } });
    if (!exists) break;
    slug = `${baseSlug}-${i + 2}`;
  }

  const passwordHash = await bcrypt.hash(ownerPassword, 10);

  const business = await prisma.business.create({
    data: {
      name,
      slug,
      category,
      city,
      country,
      website: website || undefined,
      ownerEmail,
      passwordHash
    },
    select: {
      name: true,
      slug: true,
      category: true,
      city: true,
      country: true,
      website: true,
      ownerEmail: true,
      createdAt: true
    }
  });

  return NextResponse.json({ business });
}

export async function GET() {
  // list for explore
  const businesses = await prisma.business.findMany({
    orderBy: { createdAt: "desc" },
    include: { reviews: true }
  });

  const mapped = businesses.map((b) => {
    const count = b.reviews.length;
    const avg =
      count === 0 ? 0 : b.reviews.reduce((s, r) => s + r.rating, 0) / count;

    return {
      slug: b.slug,
      name: b.name,
      category: b.category,
      city: b.city,
      country: b.country,
      website: b.website,
      ratingAvg: avg,
      ratingCount: count
    };
  });

  return NextResponse.json({ businesses: mapped });
}
