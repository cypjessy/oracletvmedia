"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import type { YouTubeVideo, YouTubeSeries } from "@/lib/youtube";

// ========== PURE HELPERS ==========

function getWatchProgressKey(videoId: string): string {
  return `watch_progress_${videoId}`;
}

function loadWatchProgress(videoId: string): { position: number; completed: boolean } | null {
  try {
    const raw = localStorage.getItem(getWatchProgressKey(videoId));
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveWatchProgress(videoId: string, position: number, duration: number) {
  try {
    const completed = position / duration >= 0.9;
    localStorage.setItem(getWatchProgressKey(videoId), JSON.stringify({ position, completed }));
  } catch { /* noop */ }
}

function parseISOToSeconds(iso: string): number {
  const m = iso.match(/PT(?:(\\d+)H)?(?:(\\d+)M)?(?:(\\d+)S)?/);
  if (!m) return 0;
  const h = parseInt(m[1] || "0", 10);
  const mn = parseInt(m[2] || "0", 10);
  const s = parseInt(m[3] || "0", 10);
  return h * 3600 + mn * 60 + s;
}

function formatISOToDisplay(iso: string): string {
  const total = parseISOToSeconds(iso);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatViewCount(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return String(n);
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  } catch { return iso; }
}

function formatTime(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// ========== PROPS ==========

interface GlobalVideoPlayerProps {
  video: YouTubeVideo | null;
  allVideos: YouTubeVideo[];
  seriesList: YouTubeSeries[];
  onClose: () => void;
  onPlayNext?: (youtubeId: string) => void;
}

// ========== COMPONENT ==========

export function GlobalVideoPlayer({ video, allVideos, seriesList, onClose, onPlayNext }: GlobalVideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [volume, setVolume] = useState(80);
  const [currentTime, setCurrentTime] = useState(0);
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [resumePosition, setResumePosition] = useState(0);
  const [showUpNext, setShowUpNext] = useState(false);
  const [upNextCountdown, setUpNextCountdown] = useState(10);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const [duration, setDuration] = useState(0);
  const [pippSupported, setPipSupported] = useState(false);
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const upNextTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const showResumeRef = useRef(false);
  const countdownRef = useRef(10);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const playerIdRef = useRef(`gvp-${Date.now()}`);
  const containerRef = useRef<HTMLDivElement>(null);

  // Derive up-next video (must be before useEffect that references it)
  const upNextVideo = useMemo(() => {
    if (!video) return undefined;
    if (video.seriesId) {
      const series = seriesList.find(s => s.id === video.seriesId);
      if (series) {
        const idx = series.videoIds.indexOf(video.youtubeId);
        if (idx >= 0 && idx < series.videoIds.length - 1) {
          const nextId = series.videoIds[idx + 1];
          return allVideos.find(v => v.youtubeId === nextId);
        }
      }
    }
    const sameCat = allVideos.filter(v => v.category === video.category && v.youtubeId !== video.youtubeId);
    return sameCat.length > 0 ? sameCat[0] : undefined;
  }, [video?.youtubeId, allVideos, seriesList]);

  // ===== NATIVE YOUTUBE PLAYER INTEGRATION =====

  // Initialize native player when video loads
  useEffect(() => {
    if (!video) return;

    const playerId = playerIdRef.current;
    let destroyed = false;

    (async () => {
      try {
        const { YoutubePlayer } = await import("@capgo/capacitor-youtube-player");

        // Destroy any existing player first
        await YoutubePlayer.destroy({ playerId }).catch(() => {});

        if (destroyed) return;

        // Get container dimensions for player size
        let width = 640;
        let height = 360;
        if (containerRef.current) {
          width = containerRef.current.offsetWidth || 640;
          height = containerRef.current.offsetHeight || 360;
        }

        await YoutubePlayer.initialize({
          playerId,
          videoId: video.youtubeId,
          playerSize: { width, height },
          playerVars: {
            autoplay: 1,
            controls: 0,
            rel: 0,
            modestbranding: 1,
            playsinline: 1,
          },
        });

        if (!destroyed) {
          setPlayerReady(true);
        }
      } catch {
        // Native player not available (browser dev mode) - fall back silently
        setPlayerReady(false);
      }
    })();

    return () => {
      destroyed = true;
      (async () => {
        try {
          const { YoutubePlayer } = await import("@capgo/capacitor-youtube-player");
          await YoutubePlayer.destroy({ playerId }).catch(() => {});
        } catch {}
      })();
    };
  }, [video?.youtubeId]);

  // Poll native player for current time and duration
  useEffect(() => {
    if (!video || !playerReady) return;

    const playerId = playerIdRef.current;

    const poll = async () => {
      try {
        const { YoutubePlayer } = await import("@capgo/capacitor-youtube-player");
        const [timeResult, durResult, stateResult] = await Promise.all([
          YoutubePlayer.getCurrentTime({ playerId }).catch(() => ({ result: { value: 0 } })),
          YoutubePlayer.getDuration({ playerId }).catch(() => ({ result: { value: 0 } })),
          YoutubePlayer.getPlayerState({ playerId }).catch(() => ({ result: { value: -1 } })),
        ]);

        const t = timeResult?.result?.value ?? 0;
        const d = durResult?.result?.value ?? 0;
        const state = stateResult?.result?.value ?? -1;

        setCurrentTime(t);
        if (d > 0) setDuration(d);

        const playing = state === 1; // PLAYING
        setIsPlaying(playing);

        // Save progress
        if (d > 0) saveWatchProgress(video.youtubeId, t, d);

        // Show up-next when 85% through
        if (d > 0 && t / d >= 0.85 && !showResumeRef.current) {
          setShowUpNext(true);
        }
      } catch {}
    };

    // Poll every 2 seconds
    pollTimerRef.current = setInterval(poll, 2000);
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [video?.youtubeId, playerReady]);

  // Play/pause via native player
  const togglePlayback = useCallback(async () => {
    try {
      const { YoutubePlayer } = await import("@capgo/capacitor-youtube-player");
      const playerId = playerIdRef.current;
      if (isPlaying) {
        await YoutubePlayer.pauseVideo({ playerId }).catch(() => {});
      } else {
        await YoutubePlayer.playVideo({ playerId }).catch(() => {});
      }
      setIsPlaying(!isPlaying);
    } catch {
      setIsPlaying(p => !p);
    }
  }, [isPlaying]);

  // Seek via native player
  const skip = useCallback(async (seconds: number) => {
    try {
      const { YoutubePlayer } = await import("@capgo/capacitor-youtube-player");
      const playerId = playerIdRef.current;
      const timeResult = await YoutubePlayer.getCurrentTime({ playerId }).catch(() => ({ result: { value: currentTime } }));
      const current = timeResult?.result?.value ?? currentTime;
      const newTime = Math.max(0, current + seconds);
      await YoutubePlayer.seekTo({ playerId, seconds: newTime, allowSeekAhead: true }).catch(() => {});
      setCurrentTime(newTime);
    } catch {
      setCurrentTime(t => {
        const d = duration || (video ? parseISOToSeconds(video.duration) : 0);
        const newTime = Math.max(0, Math.min(t + seconds, d));
        if (video) saveWatchProgress(video.youtubeId, newTime, d);
        return newTime;
      });
    }
  }, [video?.youtubeId, currentTime, duration]);

  // Seek by clicking progress bar
  const seek = useCallback(async (e: React.MouseEvent<HTMLDivElement>) => {
    try {
      const { YoutubePlayer } = await import("@capgo/capacitor-youtube-player");
      const rect = e.currentTarget.getBoundingClientRect();
      const pct = (e.clientX - rect.left) / rect.width;
      const d = duration || (video ? parseISOToSeconds(video.duration) : 0);
      const newTime = Math.round(pct * d);
      const playerId = playerIdRef.current;
      await YoutubePlayer.seekTo({ playerId, seconds: newTime, allowSeekAhead: true }).catch(() => {});
      setCurrentTime(newTime);
      if (video) saveWatchProgress(video.youtubeId, newTime, d);
    } catch {
      // Fallback: simulate seek if native player unavailable
      const rect = e.currentTarget.getBoundingClientRect();
      const pct = (e.clientX - rect.left) / rect.width;
      const d = duration || (video ? parseISOToSeconds(video.duration) : 0);
      const newTime = Math.round(pct * d);
      setCurrentTime(newTime);
      if (video) saveWatchProgress(video.youtubeId, newTime, d);
    }
  }, [video?.youtubeId, duration]);

  // Volume via native player
  const changeVolume = useCallback(async (v: number) => {
    setVolume(v);
    try {
      const { YoutubePlayer } = await import("@capgo/capacitor-youtube-player");
      const playerId = playerIdRef.current;
      await YoutubePlayer.setVolume({ playerId, volume: v }).catch(() => {});
    } catch {}
  }, []);

  const toggleMute = useCallback(async () => {
    const next = volume === 0 ? 80 : 0;
    setVolume(next);
    try {
      const { YoutubePlayer } = await import("@capgo/capacitor-youtube-player");
      const playerId = playerIdRef.current;
      if (next === 0) {
        await YoutubePlayer.mute({ playerId }).catch(() => {});
      } else {
        await YoutubePlayer.unMute({ playerId }).catch(() => {});
        await YoutubePlayer.setVolume({ playerId, volume: next }).catch(() => {});
      }
    } catch {}
  }, [volume]);

  // Fullscreen toggle via native player + orientation
  const toggleFullscreen = useCallback(async () => {
    try {
      const { YoutubePlayer } = await import("@capgo/capacitor-youtube-player");
      const playerId = playerIdRef.current;
      if (isFullscreen) {
        await YoutubePlayer.toggleFullScreen({ playerId, isFullScreen: false }).catch(() => {});
        const { ScreenOrientation } = await import("@capacitor/screen-orientation");
        await ScreenOrientation.unlock().catch(() => {});
      } else {
        const { ScreenOrientation } = await import("@capacitor/screen-orientation");
        await ScreenOrientation.lock({ orientation: "landscape-primary" }).catch(() => {});
        await YoutubePlayer.toggleFullScreen({ playerId, isFullScreen: true }).catch(() => {});
      }
      setIsFullscreen(!isFullscreen);
    } catch {
      // Fallback for browser dev mode
      setIsFullscreen(prev => !prev);
    }
  }, [isFullscreen]);

  // Signal native Android that video player is active for PiP auto-enter
  useEffect(() => {
    try {
      const androidPiP = (window as any).AndroidPiP;
      if (androidPiP?.setVideoActive) {
        androidPiP.setVideoActive(true);
      }
    } catch {}
    return () => {
      try {
        const androidPiP = (window as any).AndroidPiP;
        if (androidPiP?.setVideoActive) {
          androidPiP.setVideoActive(false);
        }
      } catch {}
    };
  }, []);

  // Check PiP support on mount
  useEffect(() => {
    (async () => {
      try {
        const { isPiPSupported } = await import("@/lib/pip");
        const supported = await isPiPSupported();
        setPipSupported(supported);
      } catch {}
    })();
  }, []);

  // Listen for PiP mode changes from native code
  useEffect(() => {
    let cleanup: (() => void) | null = null;
    (async () => {
      try {
        const { onPiPModeChange } = await import("@/lib/pip");
        cleanup = onPiPModeChange((isInPip) => {
          // If we entered PiP mode, the user can still watch. If we left PiP,
          // restore the normal view. We keep the player open regardless.
          document.body.style.overflow = isInPip ? "" : "hidden";
        });
      } catch {}
    })();
    return () => { cleanup?.(); };
  }, []);

  // Enter PiP mode via native plugin
  const handleEnterPiP = useCallback(async () => {
    try {
      const { enterPiP } = await import("@/lib/pip");
      await enterPiP(16, 9);
    } catch {}
  }, []);

  // Unlock orientation when player closes
  useEffect(() => {
    return () => {
      import("@capacitor/screen-orientation").then(({ ScreenOrientation }) => {
        ScreenOrientation.unlock().catch(() => {});
      }).catch(() => {});
    };
  }, []);

  // Auto-hide controls after 3s of inactivity
  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  }, []);

  useEffect(() => {
    resetControlsTimer();
    return () => { if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current); };
  }, [resetControlsTimer]);

  // Load resume prompt on mount
  useEffect(() => {
    if (!video) return;
    const prog = loadWatchProgress(video.youtubeId);
    if (prog && !prog.completed && prog.position > 0) {
      setResumePosition(prog.position);
      setShowResumePrompt(true);
      showResumeRef.current = true;
    }
  }, [video?.youtubeId]);

  // Up-next auto-play countdown
  useEffect(() => {
    if (!showUpNext || !video || !upNextVideo) return;
    countdownRef.current = 10;
    setUpNextCountdown(10);
    upNextTimerRef.current = setInterval(() => {
      countdownRef.current -= 1;
      setUpNextCountdown(countdownRef.current);
      if (countdownRef.current <= 0) {
        setShowUpNext(false);
        if (onPlayNext && upNextVideo) {
          onPlayNext(upNextVideo.youtubeId);
        }
      }
    }, 1000);
    return () => { if (upNextTimerRef.current) clearInterval(upNextTimerRef.current); };
  }, [showUpNext, video?.youtubeId, upNextVideo?.youtubeId, onPlayNext]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      if (upNextTimerRef.current) clearInterval(upNextTimerRef.current);
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const videoDuration = duration || (video ? parseISOToSeconds(video.duration) : 0);
  const progressPct = videoDuration > 0 ? (currentTime / videoDuration) * 100 : 0;
  const formattedDuration = video ? formatISOToDisplay(video.duration) : "0:00";
  const formattedViews = video ? formatViewCount(video.views) : "0";
  const formattedDate = video ? formatDate(video.publishedAt) : "";
  const volIcon = volume === 0 ? "volume-xmark" : volume < 50 ? "volume-low" : "volume-high";
  const seriesName = video?.seriesId ? seriesList.find(s => s.id === video.seriesId)?.name : undefined;

  const handlePlayFrom = useCallback((position: number) => {
    setCurrentTime(position);
    setShowResumePrompt(false);
    showResumeRef.current = false;
    // Seek native player to position
    (async () => {
      try {
        const { YoutubePlayer } = await import("@capgo/capacitor-youtube-player");
        const playerId = playerIdRef.current;
        await YoutubePlayer.seekTo({ playerId, seconds: position, allowSeekAhead: true }).catch(() => {});
      } catch {}
    })();
  }, []);

  const share = useCallback(() => {
    const url = `https://www.youtube.com/watch?v=${video?.youtubeId}`;
    if (navigator.share) {
      navigator.share({
        title: video?.title || "Turningpoint Church Nakuru",
        text: `Watch "${video?.title}" on Turningpoint Church Nakuru`,
        url,
      }).catch(() => {});
    } else {
      window.dispatchEvent(new CustomEvent("show-toast", {
        detail: { title: "Share", message: "Link copied to clipboard!", type: "success", duration: 2500 },
      }));
    }
  }, [video?.youtubeId, video?.title]);

  const watchOnYT = useCallback(async () => {
    if (video) {
      try {
        const { Browser } = await import("@capacitor/browser");
        await Browser.open({ url: `https://www.youtube.com/watch?v=${video.youtubeId}` });
      } catch {
        window.open(`https://www.youtube.com/watch?v=${video.youtubeId}`, "_blank");
      }
    }
  }, [video?.youtubeId]);

  if (!video) {
    return (
      <div className="gvp-loading">
        <style>{`
          .gvp-loading {
            position: fixed; inset: 0; z-index: 5000;
            background: #0F0F0F;
            display: flex; align-items: center; justify-content: center;
            flex-direction: column; gap: 16px;
          }
          .gvp-loading-spinner {
            width: 48px; height: 48px;
            border: 3px solid #242424;
            border-top-color: #E8A838;
            border-radius: 50%;
            animation: gvpSpin 0.8s linear infinite;
          }
          @keyframes gvpSpin { to { transform: rotate(360deg); } }
        `}</style>
        <div className="gvp-loading-spinner"></div>
        <span style={{ color: "#A0A0A0", fontSize: 14 }}>Loading video...</span>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .gvp-overlay {
          position: fixed; inset: 0; z-index: 5000;
          display: flex; flex-direction: column;
          animation: gvpSlideUp 0.4s cubic-bezier(0.32,0.72,0,1);
        }
        @keyframes gvpSlideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }

        .gvp-top-bar {
          padding: env(safe-area-inset-top, 20px) 16px 8px;
          display: flex; align-items: center; justify-content: space-between;
          background: #000; flex-shrink: 0;
        }
        .gvp-close-btn {
          width: 36px; height: 36px; border-radius: 50%;
          background: rgba(255,255,255,0.1); border: none; color: #fff;
          font-size: 18px; display: flex; align-items: center;
          justify-content: center; cursor: pointer;
        }
        .gvp-close-btn:active { background: rgba(255,255,255,0.2); }

        .gvp-video-area {
          width: 100%; aspect-ratio: 16/9; background: #000;
          position: relative; display: flex; flex-direction: column;
          justify-content: center; align-items: center; flex-shrink: 0;
        }

        .gvp-native-player {
          position: absolute; inset: 0; z-index: 2;
        }

        .gvp-controls-overlay {
          position: absolute; inset: 0; z-index: 3;
          display: flex; flex-direction: column;
          justify-content: center; align-items: center; gap: 20px;
          transition: opacity 0.5s ease;
        }
        .gvp-controls-overlay.hidden {
          opacity: 0; pointer-events: none;
        }
        .gvp-controls-overlay.visible {
          opacity: 1;
        }
        .gvp-center-ctrls { display: flex; align-items: center; gap: 30px; }
        .gvp-ctrl-btn {
          background: none; border: none; color: rgba(255,255,255,0.85);
          font-size: 22px; cursor: pointer; transition: all 0.2s ease;
          width: 48px; height: 48px; display: flex; align-items: center;
          justify-content: center; border-radius: 50%; position: relative;
        }
        .gvp-ctrl-btn:active { background: rgba(255,255,255,0.15); transform: scale(0.9); }
        .gvp-ctrl-btn.main {
          width: 64px; height: 64px; background: rgba(255,255,255,0.95);
          color: #0F0F0F; font-size: 26px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.4);
        }
        .gvp-ctrl-btn.main:active { background: rgba(255,255,255,0.8); }
        .gvp-ctrl-label {
          position: absolute; bottom: -2px; font-size: 9px; font-weight: 600;
          color: rgba(255,255,255,0.6); pointer-events: none;
        }

        .gvp-bottom-ctrls {
          position: absolute; bottom: 0; left: 0; right: 0;
          padding: 0 16px 12px; z-index: 3;
          transition: opacity 0.5s ease, transform 0.5s ease;
        }
        .gvp-bottom-ctrls.hidden {
          opacity: 0; transform: translateY(12px); pointer-events: none;
        }
        .gvp-bottom-ctrls.visible {
          opacity: 1; transform: translateY(0);
        }
        .gvp-progress-bar {
          width: 100%; height: 4px; background: rgba(255,255,255,0.2);
          border-radius: 2px; cursor: pointer; position: relative; margin-bottom: 8px;
        }
        .gvp-progress-fill {
          height: 100%; background: #E8A838; border-radius: 2px; position: relative;
        }
        .gvp-progress-fill::after {
          content: ''; position: absolute; right: -6px; top: -4px;
          width: 12px; height: 12px; background: #E8A838;
          border-radius: 50%; opacity: 0; transition: opacity 0.2s;
        }
        .gvp-progress-bar:hover .gvp-progress-fill::after { opacity: 1; }
        .gvp-time-row {
          display: flex; justify-content: space-between;
          font-size: 11px; color: rgba(255,255,255,0.6); font-weight: 500;
        }
        .gvp-bottom-bar {
          display: flex; align-items: center; gap: 12px; padding: 4px 0;
        }
        .gvp-vol-area { display: flex; align-items: center; gap: 8px; }
        .gvp-vol-btn {
          background: none; border: none;
          color: rgba(255,255,255,0.7); font-size: 14px; cursor: pointer;
        }
        .gvp-vol-slider {
          width: 60px; height: 3px; -webkit-appearance: none; appearance: none;
          background: rgba(255,255,255,0.2); border-radius: 2px;
          outline: none; cursor: pointer;
        }
        .gvp-vol-slider::-webkit-slider-thumb {
          -webkit-appearance: none; width: 12px; height: 12px;
          border-radius: 50%; background: #fff; cursor: pointer;
        }
        .gvp-full-btn {
          margin-left: auto; background: none; border: none;
          color: rgba(255,255,255,0.7); font-size: 16px; cursor: pointer;
        }

        .gvp-info {
          flex: 1; overflow-y: auto; padding: 16px;
          background: #0F0F0F;
        }
        .gvp-info::-webkit-scrollbar { display: none; }
        .gvp-info h2 {
          font-size: 18px; font-weight: 700; line-height: 1.3;
          margin-bottom: 8px; color: #fff;
        }
        .gvp-info-meta {
          display: flex; flex-wrap: wrap; align-items: center; gap: 8px;
          font-size: 13px; color: #A0A0A0; margin-bottom: 14px;
        }
        .gvp-info-meta .dot {
          width: 3px; height: 3px; background: #6B6B6B;
          border-radius: 50%;
        }
        .gvp-actions-row { display: flex; gap: 10px; margin-bottom: 16px; }
        .gvp-action-btn {
          flex: 1; padding: 12px; background: #1A1A1A;
          border: 1px solid #2A2A2A; border-radius: 12px;
          color: #fff; font-size: 13px; font-weight: 600;
          display: flex; align-items: center; justify-content: center;
          gap: 8px; cursor: pointer; transition: all 0.2s ease;
        }
        .gvp-action-btn:active { background: #242424; transform: scale(0.97); }
        .gvp-action-btn.primary {
          background: linear-gradient(135deg, #E8A838, #D4762A);
          border-color: transparent; color: #fff;
        }
        .gvp-desc { font-size: 14px; color: #A0A0A0; line-height: 1.7; margin-bottom: 20px; }

        .gvp-upnext {
          padding: 16px; border-top: 1px solid #2A2A2A;
          background: #0F0F0F; flex-shrink: 0;
        }
        .gvp-upnext-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 10px;
        }
        .gvp-upnext-title { font-size: 14px; font-weight: 700; display: flex; align-items: center; gap: 8px; color: #fff; }
        .gvp-upnext-countdown { font-size: 13px; color: #E8A838; font-weight: 600; }
        .gvp-upnext-cancel { background: none; border: none; color: #6B6B6B; font-size: 13px; font-weight: 500; cursor: pointer; }
        .gvp-upnext-item {
          display: flex; gap: 12px; padding: 10px;
          background: #1E1E1E; border: 1px solid #2A2A2A;
          border-radius: 16px; cursor: pointer; transition: all 0.2s ease;
        }
        .gvp-upnext-item:active { background: #242424; }
        .gvp-upnext-thumb {
          width: 100px; height: 56px; border-radius: 8px;
          overflow: hidden; flex-shrink: 0; border: 1px solid #2A2A2A;
        }
        .gvp-upnext-thumb img { width: 100%; height: 100%; object-fit: cover; }
        .gvp-upnext-info { flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: center; }
        .gvp-upnext-name { font-size: 13px; font-weight: 600; line-height: 1.3; margin-bottom: 2px; color: #fff; }
        .gvp-upnext-meta { font-size: 11px; color: #6B6B6B; }

        .gvp-resume {
          position: absolute; bottom: 60px; left: 16px; right: 16px; z-index: 10;
          padding: 14px 18px; background: #242424;
          border: 1px solid #2A2A2A; border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.5);
          display: flex; align-items: center; gap: 12px;
          animation: gvpFadeUp 0.3s ease;
        }
        @keyframes gvpFadeUp { from { opacity:0;transform:translateY(20px); } to { opacity:1;transform:translateY(0); } }
        .gvp-resume-info { flex: 1; }
        .gvp-resume-title { font-size: 13px; font-weight: 600; color: #fff; }
        .gvp-resume-sub { font-size: 12px; color: #A0A0A0; margin-top: 2px; }
        .gvp-resume-actions { display: flex; gap: 8px; }
        .gvp-resume-btn {
          padding: 8px 14px; border-radius: 10px;
          font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s ease;
        }
        .gvp-resume-btn.primary { background: #E8A838; border: none; color: #fff; }
        .gvp-resume-btn.secondary { background: #1A1A1A; border: 1px solid #2A2A2A; color: #A0A0A0; }
        .gvp-resume-btn:active { transform: scale(0.95); }

        /* Safe area spacer */
        .gvp-safe-bottom { height: env(safe-area-inset-bottom, 20px); background: #0F0F0F; flex-shrink: 0; }
      `}</style>

      <div className="gvp-overlay" style={{ background: "#0F0F0F" }}>
        {/* Top bar */}
        <div className="gvp-top-bar">
          <button className="gvp-close-btn" onClick={onClose}>
            <i className="fas fa-chevron-down"></i>
          </button>
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", fontWeight: 500 }}>
            {seriesName || "Now Playing"}
          </span>
          <div style={{ width: 36 }}></div>
        </div>

        {/* Video area */}
        <div className="gvp-video-area" onClick={resetControlsTimer} onTouchStart={resetControlsTimer}>

          {/* Native YouTube player container — the plugin renders a native view over this */}
          <div ref={containerRef} id={playerIdRef.current} className="gvp-native-player" />

          {/* Resume prompt */}
          {showResumePrompt && (
            <div className="gvp-resume">
              <div className="gvp-resume-info">
                <div className="gvp-resume-title">Resume from {formatTime(resumePosition)}?</div>
                <div className="gvp-resume-sub">You were {Math.round((resumePosition / videoDuration) * 100)}% through this video</div>
              </div>
              <div className="gvp-resume-actions">
                <button className="gvp-resume-btn secondary" onClick={() => { setShowResumePrompt(false); showResumeRef.current = false; }}>Start Over</button>
                <button className="gvp-resume-btn primary" onClick={() => handlePlayFrom(resumePosition)}>Resume</button>
              </div>
            </div>
          )}

          {/* Controls overlay */}
          <div className={`gvp-controls-overlay ${showControls ? "visible" : "hidden"}`}>
            <div className="gvp-center-ctrls">
              <button className="gvp-ctrl-btn" onClick={() => skip(-10)}>
                <i className="fas fa-rotate-left"></i>
                <span className="gvp-ctrl-label">10</span>
              </button>
              <button className="gvp-ctrl-btn main" onClick={togglePlayback}>
                <i className={`fas fa-${isPlaying ? "pause" : "play"}`}></i>
              </button>
              <button className="gvp-ctrl-btn" onClick={() => skip(10)}>
                <i className="fas fa-rotate-right"></i>
                <span className="gvp-ctrl-label">10</span>
              </button>
            </div>
          </div>

          {/* Bottom controls */}
          <div className={`gvp-bottom-ctrls ${showControls ? "visible" : "hidden"}`}>
            <div className="gvp-progress-bar" onClick={seek}>
              <div className="gvp-progress-fill" style={{ width: `${progressPct}%` }}></div>
            </div>
            <div className="gvp-time-row">
              <span>{formatTime(currentTime)}</span>
              <span>{formatISOToDisplay(video.duration)}</span>
            </div>
            <div className="gvp-bottom-bar">
              <div className="gvp-vol-area">
                <button className="gvp-vol-btn" onClick={toggleMute}>
                  <i className={`fas fa-${volIcon}`}></i>
                </button>
                <input className="gvp-vol-slider" type="range" min="0" max="100" value={volume} onChange={e => changeVolume(Number(e.target.value))} />
              </div>
              {pippSupported && (
                <button className="gvp-full-btn" onClick={handleEnterPiP} title="Picture-in-Picture">
                  <i className="fas fa-window-minimize"></i>
                </button>
              )}
              <button className={`gvp-full-btn ${isFullscreen ? "active" : ""}`} onClick={toggleFullscreen} title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}>
                <i className={`fas fa-${isFullscreen ? "compress" : "expand"}`}></i>
              </button>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="gvp-info">
          <h2>{video.title}</h2>
          <div className="gvp-info-meta">
            {seriesName && <><span>{seriesName}</span><span className="dot"></span></>}
            <span>{formattedDate}</span>
            <span className="dot"></span>
            <span>{formattedViews} views</span>
          </div>
          <div className="gvp-actions-row">
            <button className="gvp-action-btn primary" onClick={share}>
              <i className="fas fa-share"></i> Share
            </button>
            <button className="gvp-action-btn" onClick={watchOnYT}>
              <i className="fab fa-youtube"></i> YouTube
            </button>
          </div>
          {video.description && (
            <div className="gvp-desc">
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 8 }}>About</h3>
              <p>{video.description}</p>
            </div>
          )}
        </div>

        {/* Up Next */}
        {upNextVideo && (
          <div className="gvp-upnext">
            <div className="gvp-upnext-header">
              <div className="gvp-upnext-title">
                <span>Up Next</span>
                {showUpNext && <span className="gvp-upnext-countdown">Auto-play in {upNextCountdown}s</span>}
              </div>
              <button className="gvp-upnext-cancel" onClick={() => setShowUpNext(false)}>Cancel</button>
            </div>
            <div
              className="gvp-upnext-item"
              onClick={() => {
                if (onPlayNext && upNextVideo) {
                  onPlayNext(upNextVideo.youtubeId);
                }
              }}
            >
              <div className="gvp-upnext-thumb">
                <img src={upNextVideo.thumbnail} alt={upNextVideo.title} />
              </div>
              <div className="gvp-upnext-info">
                <div className="gvp-upnext-name">{upNextVideo.title}</div>
                <div className="gvp-upnext-meta">{formatISOToDisplay(upNextVideo.duration)} · {formatViewCount(upNextVideo.views)} views</div>
              </div>
            </div>
          </div>
        )}

        {/* Safe area spacer */}
        <div className="gvp-safe-bottom"></div>
      </div>
    </>
  );
}
