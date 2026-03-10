"use client";

import { useState, useEffect } from "react";
import { Button, Tooltip } from "@mantine/core";
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
    if (Notification.permission === "granted") setStatus("granted");
    else if (Notification.permission === "denied") setStatus("denied");
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

  if (status === "granted") {
    return (
      <Tooltip label="Notifiche attive" position="right">
        <IconBellRinging
          size={16}
          stroke={1.5}
          color="var(--mantine-color-green-6)"
        />
      </Tooltip>
    );
  }

  if (status === "denied") {
    return (
      <Tooltip
        label="Notifiche bloccate — abilitale dalle impostazioni del browser"
        position="right"
      >
        <IconBellOff
          size={16}
          stroke={1.5}
          color="var(--mantine-color-red-6)"
        />
      </Tooltip>
    );
  }

  return (
    <Button
      size="xs"
      variant="light"
      leftSection={<IconBell size={14} stroke={1.5} />}
      loading={status === "loading"}
      onClick={enable}
    >
      Attiva notifiche
    </Button>
  );
}
