import Stripe from "stripe";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

function getUnixPeriodEnd(sub: Stripe.Subscription): number | undefined {
  return (sub as any).current_period_end as number | undefined;
}

function mapStripeStatus(
  status: string
): "TRIALING" | "ACTIVE" | "PAST_DUE" | "FAILED" | "CANCELED" | "INACTIVE" {
  switch (status) {
    case "trialing":
      return "TRIALING";
    case "active":
      return "ACTIVE";
    case "past_due":
      return "PAST_DUE";
    case "unpaid":
    case "incomplete":
    case "incomplete_expired":
      return "FAILED";
    case "canceled":
      return "CANCELED";
    default:
      return "INACTIVE";
  }
}

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret) {
    console.error("Missing STRIPE_WEBHOOK_SECRET");
    return NextResponse.json({ error: "Missing STRIPE_WEBHOOK_SECRET" }, { status: 500 });
  }

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err?.message);
    return NextResponse.json({ error: `Bad signature: ${err.message}` }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      const businessId =
        session.client_reference_id || session.metadata?.userId || null;

      if (!businessId) return NextResponse.json({ received: true });

      const stripeCustomerId =
        typeof session.customer === "string" ? session.customer : null;

      const stripeSubscriptionId =
        typeof session.subscription === "string" ? session.subscription : null;

      let status: "TRIALING" | "ACTIVE" | "PAST_DUE" | "FAILED" | "CANCELED" | "INACTIVE" =
        "ACTIVE";
      let currentPeriodEnd: Date | null = null;

      if (stripeSubscriptionId) {
        const sub = await stripe.subscriptions.retrieve(stripeSubscriptionId);
        status = mapStripeStatus(sub.status);

        const periodEndUnix = getUnixPeriodEnd(sub);
        currentPeriodEnd = periodEndUnix ? new Date(periodEndUnix * 1000) : null;
      }

      await prisma.business.update({
        where: { id: businessId },
        data: {
          stripeCustomerId: stripeCustomerId ?? undefined,
          stripeSubscriptionId: stripeSubscriptionId ?? undefined,
          billingProvider: "STRIPE",
          subscriptionStatus: status,
          currentPeriodEnd: currentPeriodEnd ?? undefined,
        },
      });

      return NextResponse.json({ received: true });
    }

    if (event.type === "customer.subscription.updated") {
      const sub = event.data.object as Stripe.Subscription;

      const stripeCustomerId =
        typeof sub.customer === "string" ? sub.customer : null;

      const periodEndUnix = getUnixPeriodEnd(sub);

      await prisma.business.updateMany({
        where: {
          OR: [
            { stripeSubscriptionId: sub.id },
            ...(stripeCustomerId ? [{ stripeCustomerId }] : []),
          ],
        },
        data: {
          billingProvider: "STRIPE",
          subscriptionStatus: mapStripeStatus(sub.status),
          currentPeriodEnd: periodEndUnix ? new Date(periodEndUnix * 1000) : null,
        },
      });

      return NextResponse.json({ received: true });
    }

    if (event.type === "customer.subscription.deleted") {
      const sub = event.data.object as Stripe.Subscription;

      const stripeCustomerId =
        typeof sub.customer === "string" ? sub.customer : null;

      await prisma.business.updateMany({
        where: {
          OR: [
            { stripeSubscriptionId: sub.id },
            ...(stripeCustomerId ? [{ stripeCustomerId }] : []),
          ],
        },
        data: {
          billingProvider: "STRIPE",
          subscriptionStatus: "CANCELED",
          currentPeriodEnd: null,
        },
      });

      return NextResponse.json({ received: true });
    }

    return NextResponse.json({ received: true });
  } catch (e: any) {
    console.error("Webhook handler error:", e);
    return NextResponse.json({ error: e?.message ?? "Webhook error" }, { status: 500 });
  }
}
