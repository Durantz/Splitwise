"use server";
import webpush from "web-push";
import { connectDB } from "@/lib/db/mongoose";
import { PushSubscriptionModel } from "@/lib/models/PushSubscription";
import { requireSession } from "@/lib/session";

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function saveSubscription(subscription: PushSubscriptionJSON) {
  const session = await requireSession();
  await connectDB();
  await PushSubscriptionModel.findOneAndUpdate(
    { userId: session.user.id, "subscription.endpoint": subscription.endpoint },
    { userId: session.user.id, subscription },
    { upsert: true }
  );
}

export async function sendPushToUser(
  userId: string,
  payload: { title: string; body: string; url?: string }
) {
  await connectDB();
  const subs = await PushSubscriptionModel.find({ userId });
  await Promise.allSettled(
    subs.map((s) =>
      webpush.sendNotification(s.subscription, JSON.stringify(payload))
    )
  );
}
