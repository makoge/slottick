import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getMtnRequestToPayStatus } from "@/lib/mtn-momo";
import { hasValidOrigin } from "@/lib/request-security";

function normalizeMtnStatus(input: unknown) {
  const value = String(input || "").toLowerCase();

  if (["successful", "success", "completed", "paid"].includes(value)) {
    return "SUCCESS";
  }

  if (["failed", "fail", "error"].includes(value)) {
    return "FAILED";
  }

  if (["cancelled", "canceled"].includes(value)) {
    return "CANCELED";
  }

  if (["expired", "timeout"].includes(value)) {
    return "EXPIRED";
  }

  return "PENDING";
}

function addOneMonth(date = new Date()) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + 1);
  return next;
}

export async function POST(req: Request) {
  if (!hasValidOrigin(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json().catch(() => null);
    const reference = body?.reference as string | undefined;

    if (!reference) {
      return NextResponse.json({ error: "Missing reference" }, { status: 400 });
    }

    const attempt = await prisma.momoPaymentAttempt.findUnique({
      where: { externalReference: reference },
    });

    if (!attempt) {
      return NextResponse.json(
        { error: "Payment attempt not found" },
        { status: 404 }
      );
    }

    const providerData = await getMtnRequestToPayStatus(reference);

    const rawStatus =
      providerData?.status ||
      providerData?.financialTransactionStatus ||
      providerData?.reason ||
      "PENDING";

    const normalizedStatus = normalizeMtnStatus(rawStatus);
    const now = new Date();

    if (normalizedStatus === "SUCCESS") {
      const nextBillingDate = addOneMonth(now);

      await prisma.$transaction([
        prisma.momoPaymentAttempt.update({
          where: { id: attempt.id },
          data: {
            status: "SUCCESS",
            completedAt: now,
            providerTxnId:
              providerData?.financialTransactionId ||
              attempt.providerTxnId,
            rawResponseJson: JSON.stringify(providerData),
          },
        }),
        prisma.business.update({
          where: { id: attempt.businessId },
          data: {
            billingProvider: attempt.provider,
            subscriptionStatus: "ACTIVE",
            momoSubscriptionStatus: "ACTIVE",
            momoLastPaidAt: now,
            currentPeriodEnd: nextBillingDate,
            momoNextBillingDate: nextBillingDate,
          },
        }),
      ]);
    } else if (["FAILED", "EXPIRED", "CANCELED"].includes(normalizedStatus)) {
      await prisma.$transaction([
        prisma.momoPaymentAttempt.update({
          where: { id: attempt.id },
          data: {
            status: normalizedStatus as "FAILED" | "EXPIRED" | "CANCELED",
            completedAt: now,
            failureCode: providerData?.reason || null,
            failureReason:
              providerData?.message ||
              providerData?.reason ||
              null,
            rawResponseJson: JSON.stringify(providerData),
          },
        }),
        prisma.business.update({
          where: { id: attempt.businessId },
          data: {
            subscriptionStatus: "PAST_DUE",
            momoSubscriptionStatus: "PAST_DUE",
          },
        }),
      ]);
    } else {
      await prisma.momoPaymentAttempt.update({
        where: { id: attempt.id },
        data: {
          status: "PENDING",
          rawResponseJson: JSON.stringify(providerData),
        },
      });
    }

    return NextResponse.json({
      ok: true,
      reference,
      providerStatus: rawStatus,
      normalizedStatus,
      providerData,
    });
  } catch (e: any) {
    console.error("MTN status check error:", e);
    return NextResponse.json(
      { error: e?.message || "Status check failed" },
      { status: 500 }
    );
  }
}