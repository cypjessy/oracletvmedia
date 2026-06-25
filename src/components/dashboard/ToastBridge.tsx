"use client";

import { useEffect } from "react";
import { useToast } from "@/components/ui/Toast";

/**
 * Renders nothing. Listens for 'show-toast' custom events dispatched on window
 * and routes them to the ToastProvider context.
 */
export default function ToastBridge() {
  const { showToast } = useToast();

  useEffect(() => {
    function handler(e: Event) {
      const detail = (e as CustomEvent).detail;
      if (detail) {
        showToast(detail.title, detail.message, detail.type || "info", detail.duration || 4000);
      }
    }
    window.addEventListener("show-toast", handler);
    return () => window.removeEventListener("show-toast", handler);
  }, [showToast]);

  return null;
}
