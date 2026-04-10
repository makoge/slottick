import webpush from "web-push";
import { prisma } from "@/lib/db";

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const subject = process.env.VAPID_SUBJECT;

if (publicKey && privateKey && subject) {
  webpush.setVapidDetails(subject, publicKey, privateKey);
}

type PushPayload = {
  title: string;
  body: string;
  url?: string;
};

export async function sendPushToBusiness(
  businessId: string,
  payload: PushPayload
) {
  if (!publicKey || !privateKey || !subject) return;

  const subs = await prisma.pushSubscription.findMany({
    where: { businessId }
  });

  if (!subs.length) return;

  const body = JSON.stringify(payload);

  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth
            }
          },
          body
        );
      } catch (err: any) {
        const statusCode = err?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await prisma.pushSubscription.delete({
            where: { endpoint: sub.endpoint }
          }).catch(() => {});
        } else {
          console.error("Push send failed:", err);
        }
      }
    })
  );
}