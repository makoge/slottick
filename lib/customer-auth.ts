import "server-only";
import crypto from "crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { CUSTOMER_COOKIE_NAME } from "@/lib/customer-auth-constants";

export function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function getAuthedCustomer() {
  const cookieStore = await cookies();
  const token = cookieStore.get(CUSTOMER_COOKIE_NAME)?.value;
  if (!token) return null;

  const tokenHash = hashToken(token);

  const session = await prisma.customerSession.findUnique({
    where: { tokenHash },
    include: { customer: true },
  });

  if (!session) return null;

  if (session.expiresAt < new Date()) {
    await prisma.customerSession.delete({ where: { tokenHash } }).catch(() => {});
    return null;
  }

  return session.customer;
}
