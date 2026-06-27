"use client";

import { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from "react";
import { getVideo, getVideosPage, getSeries } from "@/lib/youtube";
import type { YouTubeVideo, YouTubeSeries } from "@/lib/youtube";
import { GlobalVideoPlayer } from "./GlobalVideoPlayer";

// ============================================================
// GLOBAL VIDEO PLAYER CONTEXT
// ============================================================
// Lives at the layout level so any page can play a video without
// navigating routes. This eliminates the static export route crash,
// AuthProvider race condition, and back-button history corruption.
// ============================================================

interface VideoPlayerContextType {
  play: (youtubeId: string) => void;
  close: () => void;
  isOpen: boolean;
  currentVideo: YouTubeVideo | null;
}

const VideoPlayerCtx = createContext<VideoPlayerContextType | null>(null);

export function VideoPlayerProvider({ children }: { children: ReactNode }) {
  const [currentVideo, setCurrentVideo] = useState<YouTubeVideo | null>(null);
  const [allVideos, setAllVideos] = useState<YouTubeVideo[]>([]);
  const [seriesList, setSeriesList] = useState<YouTubeSeries[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const playPromiseRef = useRef<Promise<void> | null>(null);

  // Track the last requested youtubeId to avoid stale data overwriting newer requests
  const lastRequestedIdRef = useRef<string | null>(null);

  const play = useCallback(async (youtubeId: string) => {
    lastRequestedIdRef.current = youtubeId;

    // Wait for any in-flight fetch to complete
    if (playPromiseRef.current) {
      await playPromiseRef.current.catch(() => {});
    }

    // If a newer play() was called while we waited, bail out
    if (lastRequestedIdRef.current !== youtubeId) return;

    setIsOpen(true);

    // Don't set currentVideo to null here — it causes a flash of the
    // loading state and can trigger the native player to destroy/initialize
    // rapidly. Keep the previous video visible until the new one is ready.

    const promise = (async () => {
      const [videoData, vpResult, sResult] = await Promise.all([
        getVideo(youtubeId),
        getVideosPage(50).catch(() => ({ videos: [] as YouTubeVideo[], lastDoc: null })),
        getSeries().catch(() => [] as YouTubeSeries[]),
      ]);

      // Only apply if no newer play() has been called
      if (lastRequestedIdRef.current === youtubeId) {
        if (videoData) {
          setCurrentVideo(videoData);
        }
        setAllVideos(vpResult?.videos || []);
        setSeriesList(sResult || []);
      }
    })();

    playPromiseRef.current = promise;
    await promise.catch(() => {});
    if (lastRequestedIdRef.current === youtubeId) {
      playPromiseRef.current = null;
    }
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setCurrentVideo(null);
    setAllVideos([]);
    setSeriesList([]);
  }, []);

  return (
    <VideoPlayerCtx.Provider value={{ play, close, isOpen, currentVideo }}>
      {children}
      {isOpen && (
        <GlobalVideoPlayer
          video={currentVideo}
          allVideos={allVideos}
          seriesList={seriesList}
          onClose={close}
          onPlayNext={(youtubeId) => {
            // Transition directly — keep isOpen=true to avoid flicker
            // play() no longer sets currentVideo to null before fetch,
            // so we don't null it here either.
            play(youtubeId);
          }}
        />
      )}
    </VideoPlayerCtx.Provider>
  );
}

export function useGlobalVideoPlayer(): VideoPlayerContextType {
  const ctx = useContext(VideoPlayerCtx);
  if (!ctx) throw new Error("useGlobalVideoPlayer must be used within VideoPlayerProvider");
  return ctx;
}
