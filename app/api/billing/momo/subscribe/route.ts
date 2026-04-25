import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hasValidOrigin } from "@/lib/request-security";
import {
  createExternalReference,
  initiateMtnRequestToPay,
} from "@/lib/mtn-momo";

type Provider = "MTN_MOMO" | "ORANGE_MONEY";
type Network = "MTN" | "ORANGE";

function normalizePhone(input: string) {
  return input.replace(/[^\d+]/g, "").trim();
}

function getNetworkFromProvider(provider: Provider): Network {
  return provider === "MTN_MOMO" ? "MTN" : "ORANGE";
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

    const businessId = body?.businessId as string | undefined;
    const provider = body?.provider as Provider | undefined;
    const rawPhone = body?.phone as string | undefined;

    if (!businessId) {
      return NextResponse.json({ error: "Missing businessId" }, { status: 400 });
    }

    if (!provider || !["MTN_MOMO", "ORANGE_MONEY"].includes(provider)) {
      return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
    }

    if (provider !== "MTN_MOMO") {
      return NextResponse.json(
        { error: "Orange Money is not wired yet. Use MTN for now." },
        { status: 400 }
      );
    }

    const phone = normalizePhone(rawPhone || "");
    if (!phone) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { id: true },
    });

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const amount = 300;
    const currency = process.env.MTN_MOMO_CURRENCY || "EUR";
    const network = getNetworkFromProvider(provider);
    const externalReference = createExternalReference();

    const providerResult = await initiateMtnRequestToPay({
      phone,
      amount,
      currency,
      externalReference,
    });

    const attempt = await prisma.momoPaymentAttempt.create({
      data: {
        businessId,
        provider,
        phoneNumber: phone,
        network,
        amount,
        currency,
        billingForMonth: new Date().toISOString().slice(0, 7),
        externalReference: providerResult.externalReference,
        providerTxnId: providerResult.providerTxnId,
        status: "PENDING",
        initiatedAt: new Date(),
        rawResponseJson: JSON.stringify(providerResult.raw),
      },
    });

    await prisma.business.update({
      where: { id: businessId },
      data: {
        billingProvider: provider,
        momoPhone: phone,
        momoNetwork: network,
        momoSubscriptionStatus: "PENDING_PAYMENT",
        momoNextBillingDate: addOneMonth(new Date()),
      },
    });

    return NextResponse.json({
      ok: true,
      attemptId: attempt.id,
      externalReference: providerResult.externalReference,
      status: "PENDING",
      message: "Payment prompt sent to your phone. Please confirm on your device.",
    });
  } catch (e: any) {
    console.error("MoMo subscribe error:", e);
    return NextResponse.json(
      { error: e?.message ?? "Could not start mobile money subscription" },
      { status: 500 }
    );
  }
}