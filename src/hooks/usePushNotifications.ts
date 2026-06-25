"use client";

import { useEffect, useRef } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAppStore } from "@/lib/useAppStore";

type PushNotificationData = {
  type?: string;
  url?: string;
  title?: string;
  body?: string;
};

export function usePushNotifications() {
  const { user, userDoc } = useAppStore();
  const registeredUid = useRef<string | null>(null);

  useEffect(() => {
    if (!user || !userDoc) return;
    if (registeredUid.current === user.uid) return;

    registeredUid.current = user.uid;

    (async () => {
      try {
        const { PushNotifications } = await import("@capacitor/push-notifications");

        const permStatus = await PushNotifications.checkPermissions();
        if (permStatus.receive === "prompt") {
          await PushNotifications.requestPermissions();
        }

        await PushNotifications.register();

        PushNotifications.addListener("registration", async (token) => {
          const fcmToken = token.value;
          try {
            await updateDoc(doc(db, "users", user.uid), {
              fcm_token: fcmToken,
              last_seen: Date.now(),
            });
          } catch {}
        });

        PushNotifications.addListener("registrationError", () => {});

        PushNotifications.addListener("pushNotificationReceived", (notification) => {
          const data = notification.data as PushNotificationData;
          const title = notification.title || data?.title || "FaithStream";
          const body = notification.body || data?.body || "";
          window.dispatchEvent(
            new CustomEvent("show-toast", {
              detail: { title, message: body, type: "info", duration: 4000 },
            })
          );
        });

        PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
          const data = action.notification.data as PushNotificationData;
          if (data?.url) {
            window.location.href = data.url;
          }
        });
      } catch {}
    })();
  }, [user, userDoc]);
}
