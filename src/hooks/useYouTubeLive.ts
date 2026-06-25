"use client";

import { useEffect, useState, useRef } from "react";
import { onSnapshot, getDoc } from "firebase/firestore";
import { saveLiveStatus, liveDocRef } from "@/lib/youtube";
import type { YouTubeVideo, YouTubeLiveStatus } from "@/lib/youtube";

const CHECK_INTERVAL = 60_000;
const THROTTLE_MS = 5 * 60 * 1000;

export function useYouTubeLive(): { status: YouTubeLiveStatus; loading: boolean } {
  const [status, setStatus] = useState<YouTubeLiveStatus>({ isLive: false, video: null });
  const [loading, setLoading] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(
      liveDocRef(),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setStatus({
            isLive: data.isLive || false,
            video: data.video || null,
            lastCheckedAt: data.lastCheckedAt,
            detectedAt: data.detectedAt,
          });
        } else {
          setStatus({ isLive: false, video: null });
        }
        setLoading(false);
      },
      () => {
        setStatus({ isLive: false, video: null });
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    const check = async () => {
      try {
        const snap = await getDoc(liveDocRef());
        if (!snap.exists()) {
          await triggerSync();
          return;
        }
        const data = snap.data();
        const lastChecked = data.lastCheckedAt?.toMillis?.() || 0;
        if (Date.now() - lastChecked < THROTTLE_MS) return;
        await triggerSync();
      } catch {
        // silent
      }
    };

    check();
    timerRef.current = setInterval(check, CHECK_INTERVAL);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return { status, loading };
}

async function triggerSync() {
  try {
    const res = await fetch("/api/youtube/live");
    const result = await res.json();

    if (result.isLive && result.video) {
      await saveLiveStatus({ isLive: true, video: result.video as YouTubeVideo });
    } else {
      await saveLiveStatus({ isLive: false });
    }
  } catch {
    // silent
  }
}
