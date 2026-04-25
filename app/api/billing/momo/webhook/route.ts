import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type MobileMoneyProvider = "MTN_MOMO" | "ORANGE_MONEY";
type MomoPaymentStatus = "PENDING" | "SUCCESS" | "FAILED" | "EXPIRED" | "CANCELED";

function addOneMonth(date = new Date()) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + 1);
  return next;
}

function normalizeWebhookStatus(input: unknown): MomoPaymentStatus {
  const value = String(input || "").toLowerCase();

  if (["success", "successful", "completed", "paid"].includes(value)) {
    return "SUCCESS";
  }

  if (["failed", "fail", "error"].includes(value)) {
    return "FAILED";
  }

  if (["expired", "timeout"].includes(value)) {
    return "EXPIRED";
  }

  if (["cancelled", "canceled"].includes(value)) {
    return "CANCELED";
  }

  return "PENDING";
}

function detectProvider(payload: any): MobileMoneyProvider {
  const raw =
    payload?.provider ||
    payload?.network ||
    payload?.operator ||
    payload?.source ||
    "";

  const value = String(raw).toLowerCase();

  if (value.includes("orange")) return "ORANGE_MONEY";
  return "MTN_MOMO";
}

function getReference(payload: any): string | null {
  return (
    payload?.externalReference ||
    payload?.reference ||
    payload?.referenceId ||
    payload?.transactionRef ||
    payload?.tx_ref ||
    null
  );
}

function getProviderTxnId(payload: any): string | null {
  return (
    payload?.providerTxnId ||
    payload?.transactionId ||
    payload?.financialTransactionId ||
    payload?.txnId ||
    null
  );
}

export async function POST(req: Request) {
  try {
    const payload = await req.json().catch(() => null);

    if (!payload) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const provider = detectProvider(payload);
    const reference = getReference(payload);
    const normalizedStatus = normalizeWebhookStatus(
      payload?.status || payload?.paymentStatus
    );
    const providerTxnId = getProviderTxnId(payload);

    const webhookEvent = await prisma.momoWebhookEvent.create({
      data: {
        provider,
        eventType: payload?.eventType || payload?.type || "payment_webhook",
        eventId: payload?.eventId || payload?.id || null,
        reference,
        payloadJson: JSON.stringify(payload),
        status: "received",
      },
    });

    if (!reference) {
      await prisma.momoWebhookEvent.update({
        where: { id: webhookEvent.id },
        data: {
          processedAt: new Date(),
          status: "failed",
          errorMessage: "Missing payment reference",
        },
      });

      return NextResponse.json({ error: "Missing payment reference" }, { status: 400 });
    }

    const attempt = await prisma.momoPaymentAttempt.findUnique({
      where: { externalReference: reference },
    });

    if (!attempt) {
      await prisma.momoWebhookEvent.update({
        where: { id: webhookEvent.id },
        data: {
          processedAt: new Date(),
          status: "failed",
          errorMessage: "Payment attempt not found",
        },
      });

      return NextResponse.json({ error: "Payment attempt not found" }, { status: 404 });
    }

    if (["SUCCESS", "FAILED", "EXPIRED", "CANCELED"].includes(attempt.status)) {
      await prisma.momoWebhookEvent.update({
        where: { id: webhookEvent.id },
        data: {
          processedAt: new Date(),
          status: "processed",
        },
      });

      return NextResponse.json({
        ok: true,
        status: attempt.status,
        duplicate: true,
      });
    }

    if (normalizedStatus === "SUCCESS") {
      const now = new Date();
      const nextBillingDate = addOneMonth(now);

      await prisma.$transaction([
        prisma.momoPaymentAttempt.update({
          where: { id: attempt.id },
          data: {
            status: "SUCCESS",
            providerTxnId: providerTxnId ?? attempt.providerTxnId,
            completedAt: now,
            rawResponseJson: JSON.stringify(payload),
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
        prisma.momoWebhookEvent.update({
          where: { id: webhookEvent.id },
          data: {
            processedAt: now,
            status: "processed",
          },
        }),
      ]);

      return NextResponse.json({ ok: true, status: "SUCCESS" });
    }

    if (["FAILED", "EXPIRED", "CANCELED"].includes(normalizedStatus)) {
      const now = new Date();

      await prisma.$transaction([
        prisma.momoPaymentAttempt.update({
          where: { id: attempt.id },
          data: {
            status: normalizedStatus,
            providerTxnId: providerTxnId ?? attempt.providerTxnId,
            completedAt: now,
            failureCode: payload?.failureCode || payload?.code || null,
            failureReason: payload?.failureReason || payload?.message || null,
            rawResponseJson: JSON.stringify(payload),
          },
        }),
        prisma.business.update({
          where: { id: attempt.businessId },
          data: {
            subscriptionStatus: "PAST_DUE",
            momoSubscriptionStatus: "PAST_DUE",
          },
        }),
        prisma.momoWebhookEvent.update({
          where: { id: webhookEvent.id },
          data: {
            processedAt: now,
            status: "processed",
          },
        }),
      ]);

      return NextResponse.json({ ok: true, status: normalizedStatus });
    }

    await prisma.$transaction([
      prisma.momoPaymentAttempt.update({
        where: { id: attempt.id },
        data: {
          status: "PENDING",
          providerTxnId: providerTxnId ?? attempt.providerTxnId,
          rawResponseJson: JSON.stringify(payload),
        },
      }),
      prisma.momoWebhookEvent.update({
        where: { id: webhookEvent.id },
        data: {
          processedAt: new Date(),
          status: "processed",
        },
      }),
    ]);

    return NextResponse.json({ ok: true, status: "PENDING" });
  } catch (e: any) {
    console.error("MoMo webhook error:", e);
    return NextResponse.json(
      { error: e?.message ?? "Webhook error" },
      { status: 500 }
    );
  }
}