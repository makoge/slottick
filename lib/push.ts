import webpush from "web-push";
import { prisma } from "@/lib/db";

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
const subject = process.env.VAPID_SUBJECT?.trim();

if (publicKey && privateKey && subject) {
  webpush.setVapidDetails(subject, publicKey, privateKey);
}

type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
};

type PushSubscriptionShape = {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
};

export async function sendPushToBusiness(
  businessId: string,
  payload: PushPayload
): Promise<void> {
  console.log("sendPushToBusiness called:", { businessId, payload });

  console.log("push env check:", {
    hasPublicKey: !!publicKey,
    hasPrivateKey: !!privateKey,
    hasSubject: !!subject
  });

  if (!publicKey || !privateKey || !subject) {
    console.warn("Push skipped: missing VAPID env.");
    return;
  }

  const subs = await prisma.pushSubscription.findMany({
    where: { businessId },
    select: {
      endpoint: true,
      p256dh: true,
      auth: true
    }
  });

  console.log("push subscriptions found:", subs.length);

  if (!subs.length) {
    console.warn("Push skipped: no subscriptions for business:", businessId);
    return;
  }

  const notificationBody = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url || "/"
  });

  for (const sub of subs) {
    try {
      const subscription: PushSubscriptionShape = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth
        }
      };

      console.log("Sending push to endpoint:", sub.endpoint);

      await webpush.sendNotification(subscription, notificationBody);

      console.log("Push sent successfully:", sub.endpoint);
    } catch (err: any) {
      const statusCode = err?.statusCode;

      console.error("Push send failed:", {
        endpoint: sub.endpoint,
        statusCode,
        body: err?.body,
        message: err?.message
      });

      if (statusCode === 404 || statusCode === 410) {
        console.warn("Deleting expired push subscription:", sub.endpoint);

        await prisma.pushSubscription
          .delete({
            where: { endpoint: sub.endpoint }
          })
          .catch((deleteErr) => {
            console.error("Failed to delete expired subscription:", deleteErr);
          });
      }
    }
  }
}