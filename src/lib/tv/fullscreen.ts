"use client";

import { useCallback, useState, useEffect } from "react";

/**
 * Shared hook to toggle video fullscreen + landscape orientation on mobile.
 *
 * On Android: the manifest locks the app to portrait by default.
 * When the user clicks expand:
 *   1. Capacitor ScreenOrientation unlocks to landscape
 *   2. HTML5 Fullscreen API engages
 * When the user exits (expand again, Escape, back):
 *   1. HTML5 Fullscreen exits
 *   2. Capacitor ScreenOrientation re-locks to portrait
 */
export function useFullscreenToggle() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Listen for fullscreenchange — detects Escape / back-button exits
  useEffect(() => {
    const handler = () => {
      const fs = !!document.fullscreenElement;
      setIsFullscreen(fs);
      if (!fs) {
        // User exited fullscreen externally — re-lock to portrait
        reLockPortrait();
      }
    };
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    try {
      const { ScreenOrientation } = await import("@capacitor/screen-orientation");

      if (document.fullscreenElement) {
        // ── EXIT FULLSCREEN ──
        try {
          await document.exitFullscreen();
        } catch {
          /* may not be supported in WebView */
        }
        await ScreenOrientation.lock({ orientation: "portrait" });
        setIsFullscreen(false);
      } else {
        // ── ENTER FULLSCREEN ──
        await ScreenOrientation.lock({ orientation: "landscape" });
        try {
          await document.documentElement.requestFullscreen();
        } catch {
          /* WebView may not support Fullscreen API — orientation lock is enough */
        }
        setIsFullscreen(true);
      }
    } catch {
      // ── Fallback: HTML5 Fullscreen API only (plain web / non-Capacitor) ──
      try {
        if (!document.fullscreenElement) {
          await document.documentElement.requestFullscreen();
          setIsFullscreen(true);
        } else {
          await document.exitFullscreen();
          setIsFullscreen(false);
        }
      } catch {
        // Fullscreen not supported
      }
    }
  }, []);

  return { isFullscreen, toggleFullscreen };
}

/** Helper: silently re-lock to portrait (used by the fullscreenchange listener). */
async function reLockPortrait() {
  try {
    const { ScreenOrientation } = await import("@capacitor/screen-orientation");
    await ScreenOrientation.lock({ orientation: "portrait" });
  } catch {
    /* not running in Capacitor */
  }
}
