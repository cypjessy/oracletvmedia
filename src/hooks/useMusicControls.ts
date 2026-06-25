"use client";

import { useEffect, useRef } from "react";

interface MusicControlsOptions {
  isPlaying: boolean;
  title: string;
  artist: string;
  albumArt?: string;
  onPlay?: () => void;
  onPause?: () => void;
}

export function useMusicControls({ isPlaying, title, artist, albumArt, onPlay, onPause }: MusicControlsOptions) {
  const initialized = useRef(false);

  useEffect(() => {
    let controls: any;
    let listenersUnsub: (() => void)[] = [];

    (async () => {
      try {
        const mod = await import("capacitor-music-controls-plugin");
        controls = mod.CapacitorMusicControls || mod.default || mod;

        if (!initialized.current) {
          controls.create({
            track: title || "FaithStream Radio",
            artist: artist || "Kingdom Seekers Church",
            cover: albumArt || "",
            isPlaying,
            dismissable: true,
            hasPrev: false,
            hasNext: false,
            hasClose: true,
          });
          initialized.current = true;
        } else {
          controls.updateIsPlaying(isPlaying);
          controls.updateTrack({
            track: title || "FaithStream Radio",
            artist: artist || "Kingdom Seekers Church",
            cover: albumArt || "",
          });
        }

        const subPlay = controls.on((event: string) => {
          if (event === "play" && onPlay) onPlay();
          if (event === "pause" && onPause) onPause();
        });
        listenersUnsub.push(() => {
          try { subPlay?.remove?.(); } catch {}
        });
      } catch {}
    })();

    return () => {
      listenersUnsub.forEach((fn) => fn());
    };
  }, [isPlaying, title, artist, albumArt, onPlay, onPause]);

  const destroy = () => {
    (async () => {
      try {
        const mod = await import("capacitor-music-controls-plugin");
        const controls = mod.CapacitorMusicControls || mod.default || mod;
        controls.destroy();
        initialized.current = false;
      } catch {}
    })();
  };

  return { destroy };
}
