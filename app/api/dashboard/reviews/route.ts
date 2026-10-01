// app/api/dashboard/reviews/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthedBusiness } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(_req: Request) {
  try {
    const business = await getAuthedBusiness().catch(() => null);
    if (!business?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const reviews = await prisma.review.findMany({
      where: {
        businessId: business.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
        booking: {
          select: {
            customerName: true,
            serviceName: true,
          },
        },
      },
    });

    const ratingCount = reviews.length;
    const ratingAvg =
      ratingCount > 0
        ? reviews.reduce((acc, curr) => acc + curr.rating, 0) / ratingCount
        : 0;

    const formattedReviews = reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
      customerName: r.booking?.customerName || "Verified Client",
      serviceName: r.booking?.serviceName || "Service",
    }));

    return NextResponse.json({
      reviews: formattedReviews,
      ratingAvg: Number(ratingAvg.toFixed(1)),
      ratingCount,
    });
  } catch (err: any) {
    console.error("Failed to load dashboard reviews:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to load reviews" },
      { status: 500 },
    );
  }
}
