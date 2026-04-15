// /api/debug/push
import { prisma } from "@/lib/db";

export async function GET() {
  const subs = await prisma.pushSubscription.findMany();
  return Response.json(subs);
}