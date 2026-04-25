import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createExternalReference, initiateMtnRequestToPay } from "@/lib/mtn-momo";

type Provider = "MTN_MOMO" | "ORANGE_MONEY";
type Network = "MTN" | "ORANGE";

function addOneDay(date = new Date()) {
  const next = new Date(date);
  next.setDate(next.getDate() + 1);
  return next;
}

function getNetworkFromProvider(provider: Provider): Network {
  return provider === "MTN_MOMO" ? "MTN" : "ORANGE";
}

export async function POST(req: Request) {
  try {
    const auth = req.headers.get("authorization");
    const expected = `Bearer ${process.env.CRON_SECRET || ""}`;

    if (!process.env.CRON_SECRET) {
      return NextResponse.json(
        { error: "Missing CRON_SECRET" },
        { status: 500 }
      );
    }

    if (auth !== expected) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();

    const businesses = await prisma.business.findMany({
      where: {
        billingProvider: { in: ["MTN_MOMO", "ORANGE_MONEY"] },
        momoNextBillingDate: { lte: now },
        subscriptionStatus: { in: ["ACTIVE", "PAST_DUE"] },
        momoPhone: { not: null },
      },
      select: {
        id: true,
        billingProvider: true,
        momoPhone: true,
        momoNetwork: true,
        subscriptionStatus: true,
        momoNextBillingDate: true,
      },
    });

    const results: Array<{
      businessId: string;
      ok: boolean;
      reference?: string;
      error?: string;
    }> = [];

    for (const business of businesses) {
      try {
        const provider = business.billingProvider as Provider;
        const phone = business.momoPhone;

        if (!provider || !phone) {
          results.push({
            businessId: business.id,
            ok: false,
            error: "Missing provider or phone",
          });
          continue;
        }

        if (provider !== "MTN_MOMO") {
          results.push({
            businessId: business.id,
            ok: false,
            error: "Orange Money is not wired yet",
          });
          continue;
        }

        const network = business.momoNetwork || getNetworkFromProvider(provider);
        const externalReference = createExternalReference();
        const amount = 300;
        const currency = process.env.MTN_MOMO_CURRENCY || "EUR";

        const providerResult = await initiateMtnRequestToPay({
          phone,
          amount,
          currency,
          externalReference,
        });

        await prisma.$transaction([
          prisma.momoPaymentAttempt.create({
            data: {
              businessId: business.id,
              provider,
              phoneNumber: phone,
              network,
              amount,
              currency,
              billingForMonth: now.toISOString().slice(0, 7),
              externalReference,
              providerTxnId: providerResult.providerTxnId,
              status: "PENDING",
              initiatedAt: now,
              expiresAt: addOneDay(now),
              rawResponseJson: JSON.stringify(providerResult.raw),
            },
          }),
          prisma.business.update({
            where: { id: business.id },
            data: {
              momoSubscriptionStatus: "PENDING_PAYMENT",
            },
          }),
        ]);

        results.push({
          businessId: business.id,
          ok: true,
          reference: externalReference,
        });
      } catch (error: any) {
        results.push({
          businessId: business.id,
          ok: false,
          error: error?.message || "Unknown error",
        });
      }
    }

    return NextResponse.json({
      ok: true,
      processed: businesses.length,
      results,
    });
  } catch (e: any) {
    console.error("MoMo renewal cron error:", e);
    return NextResponse.json(
      { error: e?.message || "Cron failed" },
      { status: 500 }
    );
  }
}