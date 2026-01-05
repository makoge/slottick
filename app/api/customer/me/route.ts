import { NextResponse } from "next/server";
import { getAuthedCustomer } from "@/lib/customer-auth";

export const runtime = "nodejs";

export async function GET() {
  const customer = await getAuthedCustomer();
  if (!customer) return NextResponse.json({ customer: null }, { status: 200 });

  return NextResponse.json({
    customer: {
      id: customer.id,
      email: customer.email,
      name: customer.name,
      phone: customer.phone,
      createdAt: customer.createdAt,
    },
  });
}
