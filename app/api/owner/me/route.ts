import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthedBusiness } from "@/lib/auth";

export const runtime = "nodejs";

function normalizeWebsite(website: string | null) {
  if (!website) return null;
  const w = website.trim();
  if (!w) return null;
  if (!/^https?:\/\//i.test(w)) return `https://${w}`;
  return w;
}

function isValidLogoUrlOrNull(v: unknown) {
  if (v == null) return true;
  const s = String(v).trim();
  if (!s) return true;

  // ✅ allow blob urls + normal urls
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function isValidHttpUrlOrNull(v: unknown) {
  if (v == null) return true;
  const s = String(v).trim();
  if (!s) return true;
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export async function GET() {
  const business = await getAuthedBusiness();
  if (!business) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json({
    business: {
      createdAt: business.createdAt.toISOString(),
      name: business.name,
      slug: business.slug,
      website: business.website,
      ownerEmail: business.ownerEmail,
      industry: business.industry,
      city: business.city,
      country: business.country,
      street: business.street,
      postalCode: business.postalCode,
      logoUrl: business.logoUrl
    }
  });
}

export async function PATCH(req: Request) {
  const authed = await getAuthedBusiness();
  if (!authed) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));

  const name = String(body.name ?? "").trim();
  const city = String(body.city ?? "").trim();
  const country = String(body.country ?? "").trim().toUpperCase();

  const streetRaw = body.street == null ? null : String(body.street).trim();
  const postalRaw = body.postalCode == null ? null : String(body.postalCode).trim();

  const website = normalizeWebsite(body.website == null ? null : String(body.website));

  // ✅ keep existing if undefined, remove only if null, set new if string
  const logoUrl =
    body.logoUrl === undefined
      ? undefined
      : body.logoUrl == null
        ? null
        : String(body.logoUrl).trim() || null;

  if (!name) return NextResponse.json({ error: "Business name is required." }, { status: 400 });
  if (!city) return NextResponse.json({ error: "City is required." }, { status: 400 });
  if (!country || country.length < 2)
    return NextResponse.json({ error: "Country code is required (e.g. EE)." }, { status: 400 });

  if (!isValidHttpUrlOrNull(website))
    return NextResponse.json({ error: "Website URL is invalid." }, { status: 400 });

  if (!isValidLogoUrlOrNull(logoUrl))
    return NextResponse.json({ error: "Logo URL is invalid." }, { status: 400 });

  const updated = await prisma.business.update({
    where: { id: authed.id },
    data: {
      name,
      website,
      city,
      country,
      street: streetRaw ? streetRaw : null,
      postalCode: postalRaw ? postalRaw : null,
      ...(logoUrl === undefined ? {} : { logoUrl }) // ✅ only write if provided
    },
    select: {
      createdAt: true,
      name: true,
      slug: true,
      website: true,
      ownerEmail: true,
      industry: true,
      city: true,
      country: true,
      street: true,
      postalCode: true,
      logoUrl: true
    }
  });

  return NextResponse.json({
    business: {
      createdAt: updated.createdAt.toISOString(),
      name: updated.name,
      slug: updated.slug,
      website: updated.website,
      ownerEmail: updated.ownerEmail,
      industry: updated.industry,
      city: updated.city,
      country: updated.country,
      street: updated.street,
      postalCode: updated.postalCode,
      logoUrl: updated.logoUrl
    }
  });
}
