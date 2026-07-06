"use client";

import { useEffect, useRef } from "react";

/**
 * Native YouTube player overlay used exclusively for PiP (Picture-in-Picture).
 *
 * On Android, the @capgo/capacitor-youtube-player plugin renders a native
 * SurfaceView that is part of the Activity's view hierarchy. When the system
 * enters PiP mode (via MainActivity.onUserLeaveHint), this SurfaceView is
 * captured and shown in the PiP window — unlike a WebView iframe which
 * YouTube restricts in background.
 *
 * Plyr handles all in-app playback. This component only activates when the
 * app goes to the background and a video is playing, providing the native
 * video surface for PiP.
 */
export default function NativePiPOverlay({
  videoId,
  seek,
  active,
}: {
  videoId: string | null;
  /** Seconds to seek to (syncs to current Plyr position). */
  seek?: number;
  /** When true, initializes the native player for PiP capture. */
  active: boolean;
}) {
  const playerId = "pip-native-player";
  const initializedRef = useRef(false);
  const seekRef = useRef(seek);
  seekRef.current = seek;

  // Initialize or destroy the native player based on `active`
  // Depend only on videoId and active — NOT on seek (which changes on
  // every timeupdate and would cause unnecessary init/destroy cycles).
  useEffect(() => {
    if (!videoId || !active) {
      // Destroy the native player
      if (initializedRef.current) {
        initializedRef.current = false;
        import("@capgo/capacitor-youtube-player")
          .then(({ YoutubePlayer }) => {
            YoutubePlayer.destroy({ playerId }).catch(() => {});
          })
          .catch(() => {});
      }
      return;
    }

    let destroyed = false;

    import("@capgo/capacitor-youtube-player")
      .then(({ YoutubePlayer }) => {
        if (destroyed) return;

        YoutubePlayer.initialize({
          playerId,
          videoId,
          playerSize: { width: 640, height: 360 },
        })
          .then(async () => {
            if (destroyed) return;
            initializedRef.current = true;

            // Seek to the current Plyr position if provided
            const currentSeek = seekRef.current;
            if (currentSeek !== undefined && currentSeek > 0.1) {
              try {
                await YoutubePlayer.seekTo({
                  playerId,
                  seconds: currentSeek,
                  allowSeekAhead: true,
                });
              } catch {
                // Seek may not be available immediately after init
              }
            }

            // Start playback
            try {
              await YoutubePlayer.playVideo({ playerId });
            } catch {
              // Playback may fail if the player isn't fully ready
            }
          })
          .catch(() => {
            // Player initialization failed — PiP won't work this session
          });
      })
      .catch(() => {
        // Plugin not available — not running on Capacitor
      });

    return () => {
      destroyed = true;
      if (initializedRef.current) {
        initializedRef.current = false;
        import("@capgo/capacitor-youtube-player")
          .then(({ YoutubePlayer }) => {
            YoutubePlayer.destroy({ playerId }).catch(() => {});
          })
          .catch(() => {});
      }
    };
  }, [videoId, active]);

  // Render a container that matches the video player position.
  // When active, it becomes visible and the native SurfaceView renders here.
  // When inactive, display:none stops the SurfaceView's compositing layer
  // from overlaying the WebView content (opacity/z-index aren't enough for
  // Android SurfaceViews, which render on their own compositing layer).
  return (
    <div
      id={playerId}
      style={{
        display: active ? "block" : "none",
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 5,
        pointerEvents: "none",
        overflow: "hidden",
        background: "transparent",
      }}
    />
  );
}
