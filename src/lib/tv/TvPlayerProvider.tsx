"use client";

import { createContext, useContext, useRef, useState, useCallback, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import PlyrPlayer from "@/components/tv/PlyrPlayer";

/* ─── Types ──────────────────────────────────────────────────── */

export interface TvPlayerCallbacks {
  onEnded?: () => void;
  onTimeUpdate?: (time: number) => void;
}

interface TvPlayerContextValue {
  /** Register a DOM element for the player to render into (via portal). */
  registerTarget: (el: HTMLElement | null) => void;
  /** Start/resume playing a video. */
  play: (videoId: string, seek?: number) => void;
  /** Hide the player. */
  hide: () => void;
  /** Update callbacks (onEnded, onTimeUpdate) without calling play again. */
  setCallbacks: (cbs: TvPlayerCallbacks) => void;
  /** Whether the player is currently shown. */
  visible: boolean;
  /** The current video ID. */
  currentVideoId: string | null;
}

const TvPlayerContext = createContext<TvPlayerContextValue | null>(null);

export function useTvPlayer() {
  const ctx = useContext(TvPlayerContext);
  if (!ctx) throw new Error("useTvPlayer must be used within TvPlayerProvider");
  return ctx;
}

/* ─── Provider ───────────────────────────────────────────────── */

export function TvPlayerProvider({ children }: { children: React.ReactNode }) {
  const [videoId, setVideoId] = useState<string | null>(null);
  const [seek, setSeek] = useState<number | undefined>(undefined);
  const [visible, setVisible] = useState(false);
  const callbacksRef = useRef<TvPlayerCallbacks>({});
  const videoIdRef = useRef<string | null>(null);
  // Keep ref in sync with state so stable callbacks can read the latest videoId
  videoIdRef.current = videoId;

  // Portal target — the DOM element to render the player into
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  // Stable registerTarget — no dependencies on state that changes during video transitions
  const registerTarget = useCallback((el: HTMLElement | null) => {
    setPortalTarget(el);
    // Restore seek on page navigation — only when a target is provided
    // (null = cleanup, skip restore). Uses ref so we don't need videoId in deps.
    if (el && videoIdRef.current && latestSeekRef.current !== undefined) {
      setSeek(latestSeekRef.current);
    }
  }, []);

  const [playerKey, setPlayerKey] = useState(0);
  // Track the latest seek time so it's preserved when portal target changes between pages
  const latestSeekRef = useRef<number | undefined>(undefined);

  const play = useCallback((id: string, seekTime?: number) => {
    setVideoId((prev) => {
      // Force a fresh Plyr instance on every play() call (avoids stale iframe issues)
      if (prev !== id) setPlayerKey((k) => k + 1);
      return id;
    });
    setSeek(seekTime);
    if (seekTime !== undefined) latestSeekRef.current = seekTime;
    setVisible(true);
  }, []);

  const hide = useCallback(() => {
    setVisible(false);
  }, []);

  const setCallbacks = useCallback((cbs: TvPlayerCallbacks) => {
    callbacksRef.current = cbs;
  }, []);

  // Get border-radius from portal target for matching styling
  const [borderRadius, setBorderRadius] = useState("0");
  useEffect(() => {
    if (!portalTarget) return;
    const updateBorderRadius = () => {
      setBorderRadius(window.getComputedStyle(portalTarget).borderRadius);
    };
    updateBorderRadius();
    const observer = new ResizeObserver(updateBorderRadius);
    observer.observe(portalTarget);
    return () => observer.disconnect();
  }, [portalTarget]);

  // Memoize the context value so it doesn't change on every render.
  // Only the functions are stable — state-derived values (visible, currentVideoId)
  // are included in the memo so consumers only re-render when they actually change.
  const ctx = useMemo<TvPlayerContextValue>(() => ({
    registerTarget,
    play,
    hide,
    setCallbacks,
    visible,
    currentVideoId: videoId,
  }), [registerTarget, play, hide, setCallbacks, visible, videoId]);

  return (
    <TvPlayerContext.Provider value={ctx}>
      {/* Portal — renders PlyrPlayer into the page's target element (natural document flow) */}
      {visible && videoId && portalTarget && createPortal(
        <div
          key={playerKey}
          style={{
            width: "100%",
            height: "100%",
            overflow: "hidden",
            borderRadius,
          }}
        >
          <PlyrPlayer
            videoId={videoId}
            initialSeek={seek}
            onEnded={() => callbacksRef.current.onEnded?.()}
            onTimeUpdate={(t) => {
              latestSeekRef.current = t;
              callbacksRef.current.onTimeUpdate?.(t);
            }}
          />
        </div>,
        portalTarget
      )}
      {children}
    </TvPlayerContext.Provider>
  );
}
