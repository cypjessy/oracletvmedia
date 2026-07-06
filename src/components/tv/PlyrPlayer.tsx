"use client";

import { useEffect, useRef } from "react";
import "plyr/dist/plyr.css";

/**
 * Embedded YouTube / HTML5 player using core Plyr library.
 *
 * Key design: on video ID changes, the source is updated **in-place** via
 * `player.source` instead of destroying and recreating the entire player.
 * This avoids the black flash / black screen that occurred when the YouTube
 * iframe was torn down and rebuilt from scratch on every video transition.
 *
 * For HTML5 provider changes, the player IS destroyed and recreated (since
 * the underlying DOM element type changes: <div> vs <video>).
 */
export default function PlyrPlayer({
  videoId,
  sourceUrl,
  provider = "youtube",
  onEnded,
  initialSeek,
  onTimeUpdate,
}: {
  videoId?: string;
  sourceUrl?: string;
  provider?: "youtube" | "html5";
  onEnded: () => void;
  initialSeek?: number;
  /** Called periodically during playback with the current time (seconds). */
  onTimeUpdate?: (time: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement | HTMLVideoElement>(null);
  const plyrRef = useRef<any>(null);
  const onEndedRef = useRef(onEnded);
  onEndedRef.current = onEnded;
  const onTimeUpdateRef = useRef(onTimeUpdate);
  onTimeUpdateRef.current = onTimeUpdate;
  const initialSeekRef = useRef(initialSeek);
  initialSeekRef.current = initialSeek;

  // Latest videoId ref so the source-update effect always reads the current value
  const videoIdRef = useRef(videoId);
  videoIdRef.current = videoId;

  // ─── Effect 1: Create Plyr on mount (or when provider changes). ───
  // Only re-runs when `provider` changes. Video transitions are handled
  // by Effect 2 below, which updates the source in-place on the instance.
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !el.isConnected) return;

    // TypeScript guard — already checked above but helps with closure types
    const container: HTMLElement = el;

    // Destroy any previous instance (e.g. after provider switch)
    if (plyrRef.current) {
      try { plyrRef.current.destroy(); } catch {}
      plyrRef.current = null;
    }

    let destroyed = false;
    let unmuteTimeout: ReturnType<typeof setTimeout> | undefined;
    let retryTimeout: ReturnType<typeof setTimeout> | undefined;

    function createPlayer(module: any, retry = false) {
      if (destroyed || !container.isConnected) return;
      const PlyrCtor = module.default || module;

      try {
        const player = new PlyrCtor(container, {
          autoplay: true,
          muted: true,
          controls: ["play-large","play","progress","current-time","mute","volume","fullscreen"],
        });

        const endedHandler = () => onEndedRef.current();
        player.on("ended", endedHandler);

        const timeHandler = (() => {
          let last = -1;
          return (e: CustomEvent) => {
            const t = e.detail?.plyr?.currentTime;
            if (typeof t === "number" && Math.abs(t - last) >= 0.5) {
              last = t;
              onTimeUpdateRef.current?.(t);
            }
          };
        })();
        player.on("timeupdate", timeHandler);

        // On ready: apply seek and unmute
        const readyHandler = () => {
          const seek = initialSeekRef.current;
          if (seek !== undefined && seek > 0.1) {
            try { player.currentTime = seek; } catch {}
          }

          try {
            const playPromise = player.play();
            if (playPromise && typeof playPromise.catch === "function") {
              playPromise.catch(() => {});
            }
          } catch {}

          unmuteTimeout = setTimeout(() => {
            try {
              (player as any).muted = false;
              const playPromise = player.play();
              if (playPromise && typeof playPromise.catch === "function") {
                playPromise.catch(() => {});
              }
            } catch {}
          }, 1000);
        };
        player.on("ready", readyHandler);

        plyrRef.current = player;

        if (destroyed || !container.isConnected) {
          if (unmuteTimeout) clearTimeout(unmuteTimeout);
          try { player.destroy(); } catch {}
          plyrRef.current = null;
        }
      } catch (err) {
        // Plyr failed to initialize — retry once
        if (!retry && !destroyed) {
          retryTimeout = setTimeout(() => createPlayer(module, true), 200);
        }
      }
    }

    import("plyr").then((PlyrModule) => {
      if (destroyed || !container.isConnected) return;
      createPlayer(PlyrModule, false);
    });

    return () => {
      destroyed = true;
      if (unmuteTimeout) clearTimeout(unmuteTimeout);
      if (retryTimeout) clearTimeout(retryTimeout);
      if (plyrRef.current) {
        try { plyrRef.current.destroy(); } catch {}
        plyrRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider]); // Only re-run when provider type changes

  // ─── Effect 2: Update video source in-place when videoId changes. ───
  // This keeps the Plyr instance alive and avoids destroying/recreating
  // the YouTube iframe, which causes the black screen.
  useEffect(() => {
    if (!plyrRef.current || !videoId) return;

    if (provider === "youtube") {
      // Switch YouTube video in-place — no destroy needed
      try {
        plyrRef.current.source = {
          type: "video",
          sources: [
            {
              src: `https://www.youtube.com/watch?v=${videoId}`,
              provider: "youtube",
            },
          ],
        };

        // Apply seek after source change — use ref so it's always current
        const seek = initialSeekRef.current;
        if (seek !== undefined && seek > 0.1) {
          const seekTimer = setTimeout(() => {
            try {
              if (plyrRef.current) plyrRef.current.currentTime = seek;
            } catch {}
          }, 500);
          return () => clearTimeout(seekTimer);
        }
      } catch {}
    }
  }, [videoId, provider]);

  return provider === "html5" ? (
    <video
      ref={containerRef as React.RefObject<HTMLVideoElement>}
      className="plyr"
      style={{ width: "100%", height: "100%" }}
      playsInline
      controls
    />
  ) : (
    <div
      ref={containerRef as React.RefObject<HTMLDivElement>}
      data-plyr-provider="youtube"
      data-plyr-embed-id={videoId}
      className="plyr"
      style={{ width: "100%", height: "100%" }}
    />
  );
}
