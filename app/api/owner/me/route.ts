import { NextResponse } from "next/server";
import { getAuthedBusiness } from "@/lib/auth";

export async function GET() {
  const business = await getAuthedBusiness();
  if (!business) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    business: {
      createdAt: business.createdAt.toISOString(),
      name: business.name,
      slug: business.slug,
      website: business.website,
      ownerEmail: business.ownerEmail,
      category: business.category,
      city: business.city,
      country: business.country
    }
  });
}
