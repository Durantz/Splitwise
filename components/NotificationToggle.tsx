"use client";

import { useState, useEffect } from "react";
import { ActionIcon, Tooltip } from "@mantine/core";
import { IconBell, IconBellOff, IconBellRinging } from "@tabler/icons-react";
import { saveSubscription } from "@/app/(app)/notifications/server";

type Status = "unsupported" | "default" | "loading" | "granted" | "denied";

export default function NotificationToggle() {
  const [status, setStatus] = useState<Status>("default");

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported");
      return;
    }
    if (Notification.permission === "granted") {
      setStatus("granted");
    } else if (Notification.permission === "denied") {
      setStatus("denied");
    }
  }, []);

  async function enable() {
    setStatus("loading");
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("denied");
        return;
      }

      const existing = await reg.pushManager.getSubscription();
      const sub =
        existing ??
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
        }));

      await saveSubscription(sub.toJSON() as PushSubscriptionJSON);
      setStatus("granted");
    } catch {
      setStatus("default");
    }
  }

  if (status === "unsupported") return null;

  const label =
    status === "granted"
      ? "Notifiche attive"
      : status === "denied"
      ? "Notifiche bloccate dal browser"
      : status === "loading"
      ? "Attivazione…"
      : "Attiva notifiche";

  const Icon =
    status === "granted"
      ? IconBellRinging
      : status === "denied"
      ? IconBellOff
      : IconBell;

  const color =
    status === "granted" ? "green" : status === "denied" ? "red" : "gray";

  return (
    <Tooltip label={label} position="right">
      <ActionIcon
        variant="subtle"
        color={color}
        loading={status === "loading"}
        onClick={status === "default" ? enable : undefined}
        style={{
          cursor:
            status === "granted" || status === "denied" ? "default" : "pointer",
        }}
        aria-label={label}
      >
        <Icon size={16} stroke={1.5} />
      </ActionIcon>
    </Tooltip>
  );
}
