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

function isValidLogoUrlOrNull(v: unknown) {
  // same as http(s) check, kept separate in case you expand later
  return isValidHttpUrlOrNull(v);
}

function countWords(text: string) {
  const t = text.trim();
  if (!t) return 0;
  return t.split(/\s+/).filter(Boolean).length;
}

function json(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

export async function GET() {
  const business = await getAuthedBusiness();
  if (!business) return json({ error: "Unauthorized" }, 401);

  return json({
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
      logoUrl: business.logoUrl,
      description: business.description ?? null
    }
  });
}

export async function PATCH(req: Request) {
  const authed = await getAuthedBusiness();
  if (!authed) return json({ error: "Unauthorized" }, 401);

  const body = await req.json().catch(() => ({}));

  // Build update data ONLY from fields that are provided
  const data: Record<string, any> = {};

  // name
  if (body.name !== undefined) {
    const name = String(body.name ?? "").trim();
    if (!name) return json({ error: "Business name is required." }, 400);
    data.name = name;
  }

  // city
  if (body.city !== undefined) {
    const city = String(body.city ?? "").trim();
    if (!city) return json({ error: "City is required." }, 400);
    data.city = city;
  }

  // country
  if (body.country !== undefined) {
    const country = String(body.country ?? "").trim().toUpperCase();
    if (!country || country.length < 2) {
      return json({ error: "Country code is required (e.g. EE)." }, 400);
    }
    data.country = country;
  }

  // street / postal
  if (body.street !== undefined) {
    const streetRaw = body.street == null ? null : String(body.street).trim();
    data.street = streetRaw ? streetRaw : null;
  }

  if (body.postalCode !== undefined) {
    const postalRaw = body.postalCode == null ? null : String(body.postalCode).trim();
    data.postalCode = postalRaw ? postalRaw : null;
  }

  // website
  if (body.website !== undefined) {
    const website = normalizeWebsite(body.website == null ? null : String(body.website));
    if (!isValidHttpUrlOrNull(website)) return json({ error: "Website URL is invalid." }, 400);
    data.website = website;
  }

  // logoUrl (undefined=keep, null=remove, string=set)
  if (body.logoUrl !== undefined) {
    const logoUrl =
      body.logoUrl == null ? null : String(body.logoUrl).trim() || null;

    if (!isValidLogoUrlOrNull(logoUrl)) return json({ error: "Logo URL is invalid." }, 400);
    data.logoUrl = logoUrl;
  }

  // ✅ description (max 600 words)
  if (body.description !== undefined) {
    const desc = body.description == null ? null : String(body.description);
    const trimmed = desc == null ? null : desc.trim();

    if (trimmed && countWords(trimmed) > 600) {
      return json({ error: "Description too long (max 600 words)." }, 400);
    }

    data.description = trimmed ? trimmed : null;
  }

  if (Object.keys(data).length === 0) {
    return json({ error: "No fields to update." }, 400);
  }

  const updated = await prisma.business.update({
    where: { id: authed.id },
    data,
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
      logoUrl: true,
      description: true
    }
  });

  return json({
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
      logoUrl: updated.logoUrl,
      description: updated.description ?? null
    }
  });
}
