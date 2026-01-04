import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import {
  sendWelcomeOwnerEmail,
  notifyOwnerNewSignup,
  sendVerifyEmail
} from "@/lib/email";

function sha256(x: string) {
  return crypto.createHash("sha256").update(x).digest("hex");
}

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

function normalizeWebsite(website: string | null) {
  if (!website) return null;
  const w = website.trim();
  if (!w) return null;
  // allow "example.com" -> "https://example.com"
  if (!/^https?:\/\//i.test(w)) return `https://${w}`;
  return w;
}

function getLocaleFromReferer(req: Request) {
  const ref = req.headers.get("referer");
  if (!ref) return "en";
  try {
    const seg = new URL(ref).pathname.split("/").filter(Boolean)[0];
    return seg || "en";
  } catch {
    return "en";
  }
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));

  const name = String(body.name ?? "").trim();
  const category = String(body.category ?? "Other").trim();
  const city = String(body.city ?? "").trim();
  const country = String(body.country ?? "").trim();
  const website = normalizeWebsite(body.website ? String(body.website) : null);

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

  const emailExists = await prisma.business.findUnique({ where: { ownerEmail } });
  if (emailExists) {
    return NextResponse.json(
      { error: "An account with this email already exists. Please log in." },
      { status: 409 }
    );
  }

  // Slug (unique)
  const baseSlug = slugify(body.slug ?? name) || "business";
  let slug = baseSlug;

  for (let i = 0; i < 50; i++) {
    const exists = await prisma.business.findUnique({ where: { slug } });
    if (!exists) break;
    slug = `${baseSlug}-${i + 2}`;
  }

  // if still colliding (very unlikely), fail cleanly
  const stillExists = await prisma.business.findUnique({ where: { slug } });
  if (stillExists) {
    return NextResponse.json(
      { error: "Could not generate a unique slug. Try a different name." },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(ownerPassword, 10);

  // Create business
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
      id: true,
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

  // Create email verification token
  const verifyToken = crypto.randomUUID();
  const verifyTokenHash = sha256(verifyToken);
  const verifyExpiresAt = new Date(Date.now() + 1000 * 60 * 30);

  await prisma.emailVerificationToken.create({
    data: {
      tokenHash: verifyTokenHash,
      expiresAt: verifyExpiresAt,
      businessId: business.id
    }
  });

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000";

  const locale = getLocaleFromReferer(req);

  const dashboardLink = `${baseUrl}/${locale}/dashboard`;
  const verifyLink = `${baseUrl}/${locale}/verify-email?token=${encodeURIComponent(
    verifyToken
  )}`;

  // Emails (never block signup)
  await Promise.allSettled([
    sendWelcomeOwnerEmail({
      to: business.ownerEmail,
      businessName: business.name,
      dashboardLink
    }),
    sendVerifyEmail({
      to: business.ownerEmail,
      verifyLink
    }),
    notifyOwnerNewSignup({
      ownerEmail: business.ownerEmail,
      businessName: business.name,
      slug: business.slug,
      createdAt: business.createdAt.toISOString()
    })
  ]);

  // Return safe public info
  return NextResponse.json({
    business: {
      name: business.name,
      slug: business.slug,
      category: business.category,
      city: business.city,
      country: business.country,
      website: business.website,
      ownerEmail: business.ownerEmail,
      createdAt: business.createdAt
    }
  });
}

export async function GET() {
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
