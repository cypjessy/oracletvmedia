"use client";

import { createContext, useContext, useRef, useState, useCallback, useEffect, type ReactNode } from "react";

// Lazy-loaded Capacitor MediaSession plugin.
// On web (Vercel) this gracefully degrades; on native Android it
// provides lock-screen playback controls.
// We use a dynamic import() so the bundler doesn't fail at build time
// when the package is absent, and we always null-check before calling.
let MediaSessionPromise: Promise<any> | null = null;
function getMediaSession(): Promise<any> {
  if (!MediaSessionPromise) {
    // @ts-expect-error - package may be absent; handled at runtime via .catch()
    MediaSessionPromise = import("@jofr/capacitor-media-session")
      .then((m) => m.MediaSession)
      .catch(() => null);
  }
  return MediaSessionPromise;
}

// ============================================================
// GLOBAL AUDIO PROVIDER
// ============================================================
// Lives at the layout level so the <audio> element persists
// across page navigations — radio keeps playing when users
// switch between dashboard, radio, watch, etc.
// ============================================================

interface AudioContextType {
  isPlaying: boolean;
  currentStreamUrl: string | null;
  currentStationId: number | null;
  volume: number;
  play: (url: string, stationId?: number) => void;
  pause: () => void;
  stop: () => void;
  toggle: (url: string, stationId?: number) => void;
  setVolume: (v: number) => void;
  /** Update the now-playing metadata shown in the Android media notification */
  updateMediaSession: (title: string, artist: string, albumArt?: string) => void;
  /** Register callback for next/previous station (from Android media notification buttons) */
  setNextStationCallback: (cb: (() => void) | null) => void;
  setPrevStationCallback: (cb: (() => void) | null) => void;
}

const AudioCtx = createContext<AudioContextType | null>(null);

/**
 * Sync the current playback state to Android's Media Session notification
 * (notification shade + lock screen controls) via the @jofr/capacitor-media-session
 * plugin, which bridges to Android's native MediaSession and foreground service.
 */
async function syncMediaSession(props: {
  isPlaying: boolean;
  title?: string;
  artist?: string;
  albumArt?: string;
  onPlay: () => void;
  onPause: () => void;
  onNext: (() => void) | null;
  onPrev: (() => void) | null;
}) {
  try {
    const ms = await getMediaSession();
    if (!ms) return;

    if (props.isPlaying) {
      await ms.setPlaybackState({ playbackState: "playing" });
      await ms.setMetadata({
        title: props.title || "Turningpoint Radio",
        artist: props.artist || "Turningpoint Church Nakuru",
        album: "Radio Stream",
        artwork: props.albumArt
          ? [{ src: props.albumArt, sizes: "512x512", type: "image/jpeg" }]
          : [{ src: "https://via.placeholder.com/512?text=KSC", sizes: "512x512", type: "image/png" }],
      });
    } else {
      await ms.setPlaybackState({ playbackState: "paused" });
    }

    // Register action handlers (they persist across metadata updates)
    await ms.setActionHandler({ action: "play" }, () => {
      try { props.onPlay(); } catch {}
    });
    await ms.setActionHandler({ action: "pause" }, () => {
      try { props.onPause(); } catch {}
    });
    await ms.setActionHandler({ action: "nexttrack" }, () => {
      try { props.onNext?.(); } catch {}
    });
    await ms.setActionHandler({ action: "previoustrack" }, () => {
      try { props.onPrev?.(); } catch {}
    });
    await ms.setActionHandler({ action: "stop" }, () => {
      try { props.onPause(); } catch {}
    });
  } catch {
    // Plugin may not be available
  }
}

export function AudioProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStreamUrl, setCurrentStreamUrl] = useState<string | null>(null);
  const [currentStationId, setCurrentStationId] = useState<number | null>(null);
  const [volume, setVolumeState] = useState(0.8);

  // Media session metadata (pushed by consuming components)
  const mediaTitleRef = useRef("Turningpoint Radio");
  const mediaArtistRef = useRef("Turningpoint Church Nakuru");
  const mediaArtRef = useRef<string | undefined>(undefined);

  // Next/prev station callbacks (set by consuming components).
  // These are simple callbacks — the consuming component finds the next/prev
  // station from its own stations state, so no station ID is passed.
  // Stored as refs to avoid re-render loops when consumers pass inline callbacks.
  const nextCbRef = useRef<(() => void) | null>(null);
  const prevCbRef = useRef<(() => void) | null>(null);

  // Sync media session whenever isPlaying or metadata changes
  useEffect(() => {
    syncMediaSession({
      isPlaying,
      title: mediaTitleRef.current,
      artist: mediaArtistRef.current,
      albumArt: mediaArtRef.current,
      onPlay: () => {
        // Resume the current audio stream
        const audio = audioRef.current;
        if (audio?.src && audio.src !== "") {
          audio.play().catch(() => {});
        }
      },
      onPause: () => {
        audioRef.current?.pause();
      },
      onNext: () => {
        // The consuming component handles station switching from its own state
        nextCbRef.current?.();
      },
      onPrev: () => {
        prevCbRef.current?.();
      },
    });
  }, [isPlaying]);

  const updateMediaSession = useCallback(async (title: string, artist: string, albumArt?: string) => {
    mediaTitleRef.current = title;
    mediaArtistRef.current = artist;
    mediaArtRef.current = albumArt;
    // Update the notification immediately so subsequent song changes
    // reflect in the Android media notification without waiting for a
    // play/pause state change.
    try {
      const ms = await getMediaSession();
      if (!ms) return;
      await ms.setMetadata({
        title,
        artist,
        album: "Radio Stream",
        artwork: albumArt
          ? [{ src: albumArt, sizes: "512x512", type: "image/jpeg" }]
          : [{ src: "https://via.placeholder.com/512?text=KSC", sizes: "512x512", type: "image/png" }],
      });
    } catch {
      // Plugin not available
    }
  }, []);

  const setNextStationCallback = useCallback((cb: (() => void) | null) => {
    nextCbRef.current = cb;
  }, []);

  const setPrevStationCallback = useCallback((cb: (() => void) | null) => {
    prevCbRef.current = cb;
  }, []);

  // Create a persistent <audio> element outside the React tree
  // so it survives any re-renders or hydration mismatches.
  useEffect(() => {
    const audio = new Audio();
    audio.style.display = "none";
    audio.preload = "none";

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => setIsPlaying(false);
    const onError = () => {
      // Stream might just be connecting — don't update isPlaying here
      // because some stream errors are recoverable on reconnect
    };

    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);

    document.body.appendChild(audio);
    audioRef.current = audio;

    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      audio.remove();
      audioRef.current = null;
    };
  }, []);

  const play = useCallback((url: string, stationId?: number) => {
    const audio = audioRef.current;
    if (!audio || !url) return;
    const cacheBust = url.includes("?") ? `&_=${Date.now()}` : `?_=${Date.now()}`;
    audio.src = url + cacheBust;
    audio.load();
    const p = audio.play();
    if (p !== undefined) {
      p.catch(() => {
        setTimeout(() => {
          audio.play().catch(() => {});
        }, 300);
      });
    }
    setCurrentStreamUrl(url);
    setCurrentStationId(stationId ?? null);
  }, []);

  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
    setIsPlaying(false);
    setCurrentStreamUrl(null);
    setCurrentStationId(null);
  }, []);

  const toggle = useCallback((url: string, stationId?: number) => {
    const audio = audioRef.current;
    if (!audio || !url) return;

    if (audio.src && audio.src !== "" && !audio.paused) {
      // Currently playing — pause
      audio.pause();
    } else {
      // Force a fresh stream connection with cache busting.
      // Setting the same URL after pause often fails to re-establish
      // the stream on Android WebView — a timestamp param ensures
      // the browser treats it as a new request.
      const cacheBust = url.includes("?") ? `&_=${Date.now()}` : `?_=${Date.now()}`;
      audio.src = url + cacheBust;
      audio.load();

      // Attempt play with a retry — streams need time to buffer
      const attemptPlay = () => {
        const p = audio.play();
        if (p !== undefined) {
          p.catch(() => {
            // Retry once after a brief delay
            setTimeout(() => {
              audio.play().catch(() => {});
            }, 300);
          });
        }
      };
      attemptPlay();

      setCurrentStreamUrl(url);
      setCurrentStationId(stationId ?? null);
    }
  }, []);

  const setVolume = useCallback((v: number) => {
    const clamped = Math.max(0, Math.min(1, v));
    setVolumeState(clamped);
    if (audioRef.current) {
      audioRef.current.volume = clamped;
    }
  }, []);

  // Sync initial volume when audio element is created
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, []);

  return (
    <AudioCtx.Provider value={{
      isPlaying, currentStreamUrl, currentStationId, volume,
      play, pause, stop, toggle, setVolume,
      updateMediaSession,
      setNextStationCallback, setPrevStationCallback,
    }}>
      {children}
    </AudioCtx.Provider>
  );
}

export function useAudio(): AudioContextType {
  const ctx = useContext(AudioCtx);
  if (!ctx) throw new Error("useAudio must be used within AudioProvider");
  return ctx;
}
