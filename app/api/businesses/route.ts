import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import {
  sendWelcomeOwnerEmail,
  notifyOwnerNewSignup,
  sendVerifyEmail
} from "@/lib/email";
import { hasValidOrigin } from "@/lib/request-security";

// ✅ match your Prisma enum values (schema.prisma)
const INDUSTRY_VALUES = new Set([
  "BEAUTY_AND_CARE",
  "WELLNESS_AND_LIFESTYLE",
  "CREATIVE_SERVICES",
  "HOME_AND_LOCAL",
  "EDUCATION_AND_PROFESSIONALS"
] as const);

type IndustryEnum =
  | "BEAUTY_AND_CARE"
  | "WELLNESS_AND_LIFESTYLE"
  | "CREATIVE_SERVICES"
  | "HOME_AND_LOCAL"
  | "EDUCATION_AND_PROFESSIONALS";

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

// ✅ Accept either pretty labels or enum values from the frontend
function toIndustryEnum(input: unknown): IndustryEnum {
  const raw = String(input ?? "").trim();

  // already enum?
  if (INDUSTRY_VALUES.has(raw as IndustryEnum)) return raw as IndustryEnum;

  // pretty label -> enum mapping
  const map: Record<string, IndustryEnum> = {
    "Beauty & care": "BEAUTY_AND_CARE",
    "Wellness & lifestyle": "WELLNESS_AND_LIFESTYLE",
    "Creative services": "CREATIVE_SERVICES",
    "Home & local": "HOME_AND_LOCAL",
    "Education & professionals": "EDUCATION_AND_PROFESSIONALS"
  };

  return map[raw] ?? "BEAUTY_AND_CARE";
}

export async function POST(req: Request) {
  if (!hasValidOrigin(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));

  // logoUrl safety
  const logoUrl = body.logoUrl ? String(body.logoUrl).trim() : "";
  const safeLogoUrl =
    logoUrl && /^https?:\/\//i.test(logoUrl) ? logoUrl : undefined;

  const name = String(body.name ?? "").trim();

  // ✅ industry instead of category
  const industry = toIndustryEnum(body.industry ?? body.category);

  const city = String(body.city ?? "").trim();
  const country = String(body.country ?? "").trim().toUpperCase();

  // ✅ new fields
  const street = String(body.street ?? "").trim();
  const postalCode = String(body.postalCode ?? "").trim();

  const website = normalizeWebsite(body.website ? String(body.website) : null);

  const ownerEmail = String(body.ownerEmail ?? "").trim().toLowerCase();
  const ownerPassword = String(body.ownerPassword ?? "");

  if (!name || !city || !country || !ownerEmail || !ownerPassword) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  if (!isValidEmail(ownerEmail)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  // keep your rule (8)
  if (ownerPassword.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 }
    );
  }

  // basic country sanity
  if (country.length < 2) {
    return NextResponse.json(
      { error: "Country code is required (e.g. EE)" },
      { status: 400 }
    );
  }

  const emailExists = await prisma.business.findUnique({
    where: { ownerEmail }
  });
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

  const stillExists = await prisma.business.findUnique({ where: { slug } });
  if (stillExists) {
    return NextResponse.json(
      { error: "Could not generate a unique slug. Try a different name." },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(ownerPassword, 10);

  const now = new Date();
const trialEndsAt = new Date(now);
trialEndsAt.setDate(trialEndsAt.getDate() + 14);

  const business = await prisma.business.create({
    data: {
      name,
      slug,
      industry, // ✅ enum
      city,
      country,
      street: street || undefined, // ✅ optional
      postalCode: postalCode || undefined, // ✅ optional
      website: website || undefined,
      ownerEmail,
      passwordHash,
      logoUrl: safeLogoUrl,
      subscriptionStatus: "trialing",
      trialEndsAt
    },
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
      ownerEmail: true,
      createdAt: true,
      logoUrl: true,
      subscriptionStatus: true,
      trialEndsAt: true
    }
  });

  // Email verification token
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

  return NextResponse.json({
    business: {
      name: business.name,
      slug: business.slug,
      industry: business.industry,
      city: business.city,
      country: business.country,
      street: business.street,
      postalCode: business.postalCode,
      website: business.website,
      ownerEmail: business.ownerEmail,
      createdAt: business.createdAt,
      logoUrl: business.logoUrl,
      subscriptionStatus: business.subscriptionStatus,
      trialEndsAt: business.trialEndsAt
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
      industry: b.industry,
      city: b.city,
      country: b.country,
      street: b.street,
      postalCode: b.postalCode,
      website: b.website,
      ratingAvg: avg,
      ratingCount: count,
      logoUrl: b.logoUrl
    };
  });

  return NextResponse.json({ businesses: mapped });
}
