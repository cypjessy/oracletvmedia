"use client";

import React, { useEffect, useRef, useState } from "react";
import AdminBottomNav from "@/components/admin/AdminBottomNav";
import ToastBridge from "@/components/dashboard/ToastBridge";
import {
  getNowPlaying, getStreamers, getStationStatus, toggleAutoDJ,
  getPlaylists, createPlaylist as apiCreatePlaylist,
  togglePlaylistEnabled as apiTogglePlaylist,
  deletePlaylist as apiDeletePlaylist,
  updatePlaylist as apiUpdatePlaylist,
  addSongsToPlaylist as apiAddSongs,
  removeSongFromPlaylist as apiRemoveSong,
  getStationFiles,
  deleteStationFiles, deleteFile, updateFileMetadata, uploadFile,
  createStreamer as apiCreateStreamer,
  updateStreamer as apiUpdateStreamer,
  deleteStreamer as apiDeleteStreamer,
  getSongHistory, getListenerDetails,
  getWebhooks as apiGetWebhooks,
  createWebhook as apiCreateWebhook,
  updateWebhook as apiUpdateWebhook,
  deleteWebhook as apiDeleteWebhook,
  toggleWebhook as apiToggleWebhook,
  testWebhook as apiTestWebhook,
  getSettings as apiGetSettings,
  updateSettings as apiUpdateSettings,
  getQueue as apiGetQueue,
  getStationSourceInfo,
} from "@/lib/azuracast";
import type { Streamer, Playlist, StationFile, QueueItem, StationSourceInfo } from "@/lib/azuracast";

// ========== REFERENCE DATA ==========
const sidebarTabs = [
  { id: "overview", icon: "fa-house", label: "Overview" },
  { id: "go-live", icon: "fa-microphone", label: "Go Live" },
  { id: "media", icon: "fa-music", label: "Media" },
  { id: "playlists", icon: "fa-list", label: "Playlists" },
  { id: "djs", icon: "fa-user", label: "DJs" },
  { id: "schedule", icon: "fa-calendar-days", label: "Schedule" },
  { id: "analytics", icon: "fa-chart-line", label: "Analytics" },
  { id: "webhooks", icon: "fa-link", label: "Webhooks" },
  { id: "settings", icon: "fa-gear", label: "Settings" },
];

// ========== REFERENCE DATA ==========
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

// ========== EVENT OPTIONS ==========
const AVAILABLE_EVENTS = [
  { id: "song_changed", label: "Song Changed" },
  { id: "dj_connected", label: "DJ Connected" },
  { id: "dj_disconnected", label: "DJ Disconnected" },
  { id: "station_online", label: "Station Online" },
  { id: "station_offline", label: "Station Offline" },
  { id: "listener_milestone", label: "Listener Milestone" },
];

// ========== INITIAL SETTINGS ==========
const defaultSettings = {
  stationName: "Kingdom Seekers Radio",
  streamUrl: "https://azuracast.histoview.co.ke/radio/8000/kingdom_seekers.mp3",
  publicPageUrl: "https://faithstream.app/radio/grace",
  autoDJEnabled: true,
  maxListeners: 500,
  defaultBitrate: "128",
  publicPageVisible: true,
  mountPoints: [
    { mount: "/grace", type: "stream", listeners: 234 },
    { mount: "/grace_live", type: "live", listeners: 42 },
    { mount: "/grace_mobile", type: "mobile", listeners: 66 },
  ],
};
export default function AdminRadioPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [autoDJ, setAutoDJ] = useState(false);
  const [listeners, setListeners] = useState(0);
  const [overviewNP, setOverviewNP] = useState<import("@/lib/azuracast").NowPlayingData | null>(null);
  const [overviewHistory, setOverviewHistory] = useState<import("@/lib/azuracast").SongHistoryItem[]>([]);
  const [overviewLoading, setOverviewLoading] = useState(false);

  // Media Library state
  const [mediaSearch, setMediaSearch] = useState("");
  const [mediaFilterPlaylist, setMediaFilterPlaylist] = useState("");
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set());
  const [uploadProgress, setUploadProgress] = useState<{ id: string; name: string; progress: number }[]>([]);
  const [editingFile, setEditingFile] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editArtist, setEditArtist] = useState("");
  const [editAlbum, setEditAlbum] = useState("");
  const [showMediaActions, setShowMediaActions] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [playlistPickerOpen, setPlaylistPickerOpen] = useState(false);

  // Go Live state
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [liveSeconds, setLiveSeconds] = useState(0);
  const [selectedMicId, setSelectedMicId] = useState("");
  const [streamQuality, setStreamQuality] = useState("128");
  const [selectedStreamerId, setSelectedStreamerId] = useState("");
  const [djName, setDjName] = useState("");
  const [micLevel, setMicLevel] = useState(0);
  const micLevelRef = useRef<number>(0);
  const liveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [streamers, setStreamers] = useState<Streamer[]>([]);
  const [stationLive, setStationLive] = useState(false);
  const [liveListeners, setLiveListeners] = useState(0);
  const [nowPlayingTitle, setNowPlayingTitle] = useState("");
  const [nowPlayingArtist, setNowPlayingArtist] = useState("");
  const [availableMics, setAvailableMics] = useState<MediaDeviceInfo[]>([]);
  const [micPermission, setMicPermission] = useState<"prompt"|"granted"|"denied">("prompt");
  const [backendRunning, setBackendRunning] = useState(false);
  const [frontendRunning, setFrontendRunning] = useState(false);
  const micStreamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const [sourceInfo, setSourceInfo] = useState<StationSourceInfo | null>(null);

  // Playlists state
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [stationFiles, setStationFiles] = useState<StationFile[]>([]);
  const [loadingPlaylists, setLoadingPlaylists] = useState(true);
  const [expandedPlaylist, setExpandedPlaylist] = useState<string | null>(null);
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [plForm, setPlForm] = useState({ name: "", type: "standard", order: "shuffle", weight: 10 });
  const [plSchedule, setPlSchedule] = useState({ days: [] as string[], startTime: "09:00", endTime: "17:00" });
  const [showSongPicker, setShowSongPicker] = useState(false);
  const [songPickerPlaylistId, setSongPickerPlaylistId] = useState<string | null>(null);
  const [pickerSearch, setPickerSearch] = useState("");
  const [playlistFilter, setPlaylistFilter] = useState("");
  const [plFilterTab, setPlFilterTab] = useState("all");
  const [selectedPlId, setSelectedPlId] = useState<string | null>(null);
  const [showEditPlModal, setShowEditPlModal] = useState(false);
  const [editingPlId, setEditingPlId] = useState<string | null>(null);
  const [plConfirmDelete, setPlConfirmDelete] = useState<string | null>(null);
  const [plMenuOpen, setPlMenuOpen] = useState<string | null>(null);
  const [addSongsSearch, setAddSongsSearch] = useState("");
  const [addSongsSelected, setAddSongsSelected] = useState<Set<string>>(new Set());
  const [plCreateType, setPlCreateType] = useState<"standard" | "scheduled" | "on_demand">("standard");
  const [plCreateOrder, setPlCreateOrder] = useState<"shuffle" | "sequential">("shuffle");
  const [addSongsPlId, setAddSongsPlId] = useState<string | null>(null);
  const [showScheduleView, setShowScheduleView] = useState(false);

  // DJ Accounts state
  const [djList, setDjList] = useState<import("@/lib/azuracast").Streamer[]>([]);
  const [showAddDJ, setShowAddDJ] = useState(false);
  const [djForm, setDjForm] = useState({ displayName: "", username: "", password: "" });
  const [editingDJ, setEditingDJ] = useState<string | null>(null);
  const [expandedDJ, setExpandedDJ] = useState<string | null>(null);

  // Schedule state
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [editingBlock, setEditingBlock] = useState<{ day: number; startHour: number; endHour: number; name: string; color: string; playlistId: string } | null>(null);
  const [showAddSchedule, setShowAddSchedule] = useState(false);
  const [schedForm, setSchedForm] = useState({ playlistId: "", days: [] as string[], startTime: "09:00", endTime: "17:00" });

  // Analytics state
  const [currentListeners, setCurrentListeners] = useState(0);
  const [peakListeners, setPeakListeners] = useState(0);
  const [listenerHistory, setListenerHistory] = useState<{ time: string; count: number }[]>([]);
  const [topSongs, setTopSongs] = useState<{ title: string; artist: string; plays: number }[]>([]);
  const [broadcastHistory, setBroadcastHistory] = useState<{ date: string; dj: string; duration: string; listeners: number }[]>([]);

  // Webhooks state
  const [webhooks, setWebhooks] = useState<import("@/lib/azuracast").Webhook[]>([]);
  const [showAddWebhook, setShowAddWebhook] = useState(false);
  const [whForm, setWhForm] = useState({ url: "", secretKey: "", events: [] as string[] });

  // Play Control state
  const [pcMode, setPcMode] = useState<"schedule" | "playlist" | "single">("schedule");
  const [pcQueue, setPcQueue] = useState<QueueItem[]>([]);
  const [pcPlaylists, setPcPlaylists] = useState<Playlist[]>([]);
  const [pcFiles, setPcFiles] = useState<StationFile[]>([]);
  const [pcActivePlaylist, setPcActivePlaylist] = useState<string | null>(null);
  const [pcActiveTrack, setPcActiveTrack] = useState<string>("");
  const [pcAutoDJ, setPcAutoDJ] = useState(false);
  const [pcLoading, setPcLoading] = useState(false);
  const [pcActionLoading, setPcActionLoading] = useState<string | null>(null);

  // Shared per-tab loading states
  const [plActionLoading, setPlActionLoading] = useState(false);
  const [djActionLoading, setDjActionLoading] = useState(false);
  const [whActionLoading, setWhActionLoading] = useState(false);
  const [mediaActionLoading, setMediaActionLoading] = useState(false);

  // Settings state
  const [settings, setSettings] = useState(defaultSettings);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  // Fetch settings when tab is active
  useEffect(() => {
    if (activeTab !== "settings") return;
    setSettingsLoading(true);
    setSettingsError(null);
    Promise.all([
      apiGetSettings(),
      fetch("https://azuracast.histoview.co.ke/api/station/1/mounts", {
        headers: { Authorization: "Bearer fa2f4050cde11b3f:800c5d8b345ff6e692f73a01daf92456" },
      }).then((r) => r.json()).catch(() => [] as any[]),
    ]).then(([s, mounts]) => {
      setSettings({
        stationName: s.name,
        streamUrl: s.streamUrl,
        publicPageUrl: s.publicPageUrl,
        autoDJEnabled: s.autoDJ,
        maxListeners: s.maxListeners,
        defaultBitrate: String(s.defaultBitrate),
        publicPageVisible: s.publicPageVisible,
        mountPoints: (mounts as any[]).map((m: any) => ({
          mount: m.name || m.path || "",
          type: m.is_default ? "stream" : "live",
          listeners: m.listeners?.current ?? 0,
        })),
      });
      setSettingsLoading(false);
    }).catch(() => {
      setSettingsError("Failed to load settings");
      setSettingsLoading(false);
    });
  }, [activeTab]);

  const saveSettings = async () => {
    setSettingsSaving(true);
    setSettingsError(null);
    setSettingsSuccess(false);
    try {
      const updated = await apiUpdateSettings({
        name: settings.stationName,
        publicPageVisible: settings.publicPageVisible,
      });
      setSettingsSuccess(true);
      setTimeout(() => setSettingsSuccess(false), 3000);
    } catch {
      setSettingsError("Failed to save settings");
    }
    setSettingsSaving(false);
  };

  // Real microphone audio level from getUserMedia analyser
  useEffect(() => {
    if (activeTab !== "go-live") return;
    if (!isBroadcasting) {
      setMicLevel(0);
      micLevelRef.current = 0;
      return;
    }
    if (!micStreamRef.current) return;
    let frame: number;
    const animate = () => {
      if (analyserRef.current) {
        const data = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        const pct = Math.min(100, (avg / 255) * 100);
        micLevelRef.current = micLevelRef.current + (pct - micLevelRef.current) * 0.15;
        setMicLevel(micLevelRef.current);
      }
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [isBroadcasting, activeTab]);

  // Live broadcast timer
  useEffect(() => {
    if (isBroadcasting) {
      liveTimerRef.current = setInterval(() => {
        setLiveSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (liveTimerRef.current) {
        clearInterval(liveTimerRef.current);
        liveTimerRef.current = null;
      }
    }
    return () => {
      if (liveTimerRef.current) {
        clearInterval(liveTimerRef.current);
        liveTimerRef.current = null;
      }
    };
  }, [isBroadcasting]);

  // Poll AzuraCast now playing (Go Live tab only)
  useEffect(() => {
    if (activeTab !== "go-live") return;
    let mounted = true;
    const poll = async () => {
      const np = await getNowPlaying("1");
      if (!mounted) return;
      setStationLive(np.station.isLive);
      setLiveListeners(np.listeners.current);
      setNowPlayingTitle(np.nowPlaying?.song?.title ?? "");
      setNowPlayingArtist(np.nowPlaying?.song?.artist ?? "");
    };
    poll();
    const interval = setInterval(poll, 5000);
    return () => { mounted = false; clearInterval(interval); };
  }, [activeTab]);

  // Poll station backend/frontend status
  useEffect(() => {
    if (activeTab !== "go-live") return;
    let mounted = true;
    const poll = async () => {
      const s = await getStationStatus("1");
      if (!mounted) return;
      setBackendRunning(s.backendRunning);
      setFrontendRunning(s.frontendRunning);
    };
    poll();
    const interval = setInterval(poll, 10000);
    return () => { mounted = false; clearInterval(interval); };
  }, [activeTab]);

  // Fetch streamer accounts
  useEffect(() => {
    if (activeTab !== "go-live") return;
    getStreamers().then(setStreamers).catch(() => {});
  }, [activeTab]);

  // Fetch source connection info (Icecast source URL, password, port)
  useEffect(() => {
    if (activeTab !== "go-live") return;
    getStationSourceInfo().then(setSourceInfo).catch(() => {});
  }, [activeTab]);

  // Fetch streamers for DJ tab
  useEffect(() => {
    if (activeTab !== "djs") return;
    getStreamers().then(setDjList).catch(() => {});
  }, [activeTab]);

  // Fetch playlists and files when Playlists, Media, or Schedule tab is active
  useEffect(() => {
    if (activeTab !== "playlists" && activeTab !== "media" && activeTab !== "schedule") return;
    setLoadingPlaylists(activeTab === "playlists");
    Promise.all([
      getPlaylists().then(setPlaylists),
      getStationFiles().then(setStationFiles),
    ]).catch(() => {}).finally(() => {
      if (activeTab === "playlists") setLoadingPlaylists(false);
    });
  }, [activeTab]);

  // Enumerate audio input devices
  useEffect(() => {
    if (activeTab !== "go-live") return;
    navigator.mediaDevices?.enumerateDevices().then((devices) => {
      const mics = devices.filter((d) => d.kind === "audioinput");
      setAvailableMics(mics);
      if (mics.length > 0 && !selectedMicId) setSelectedMicId(mics[0].deviceId);
    }).catch(() => {});
  }, [activeTab]);

  // Request mic access when broadcasting
  useEffect(() => {
    if (activeTab !== "go-live" || !isBroadcasting) {
      if (!isBroadcasting && micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((t) => t.stop());
        micStreamRef.current = null;
        if (audioCtxRef.current) {
          audioCtxRef.current.close();
          audioCtxRef.current = null;
          analyserRef.current = null;
        }
      }
      return;
    }
    const startMic = async () => {
      try {
        const constraints: MediaStreamConstraints = {
          audio: selectedMicId ? { deviceId: { exact: selectedMicId } } : true,
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        micStreamRef.current = stream;
        setMicPermission("granted");
        const ctx = new AudioContext();
        audioCtxRef.current = ctx;
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        analyserRef.current = analyser;
        const source = ctx.createMediaStreamSource(stream);
        source.connect(analyser);
      } catch {
        setMicPermission("denied");
      }
    };
    startMic();
    return () => {
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((t) => t.stop());
        micStreamRef.current = null;
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
        analyserRef.current = null;
      }
    };
  }, [isBroadcasting, selectedMicId, activeTab]);

  // Fetch analytics data
  useEffect(() => {
    if (activeTab !== "analytics") return;
    let mounted = true;
    const fetchData = async () => {
      const np = getNowPlaying("1");
      const hist = getSongHistory(100);
      const [npData, history] = await Promise.all([np, hist]);
      if (!mounted) return;
      const lc = npData.listeners.current;
      setCurrentListeners(lc);
      setPeakListeners((prev) => Math.max(prev, lc));
      const now = new Date();
      setListenerHistory((prev) => [...prev.slice(-47), { time: `${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`, count: lc }]);
      // Compute top songs from history
      const songMap = new Map<string, { title: string; artist: string; plays: number }>();
      for (const h of history) {
        const key = h.song.title + "|" + h.song.artist;
        const existing = songMap.get(key);
        if (existing) existing.plays++;
        else songMap.set(key, { title: h.song.title, artist: h.song.artist, plays: 1 });
      }
      setTopSongs(Array.from(songMap.values()).sort((a, b) => b.plays - a.plays).slice(0, 10));
      // Broadcast history
      const bHistory = history.slice(0, 20).map((h) => {
        const d = h.playedAt ? new Date(h.playedAt) : new Date();
        return {
          date: d.toLocaleDateString(),
          dj: h.song.artist || "AutoDJ",
          duration: `${Math.floor(h.duration / 60)}m ${h.duration % 60}s`,
          listeners: 0,
        };
      });
      setBroadcastHistory(bHistory);
    };
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => { mounted = false; clearInterval(interval); };
  }, [activeTab]);

  // Fetch webhooks when tab is active
  useEffect(() => {
    if (activeTab !== "webhooks") return;
    apiGetWebhooks().then(setWebhooks).catch(() => {});
  }, [activeTab]);

  // Poll overview data when tab is active
  useEffect(() => {
    if (activeTab !== "overview") return;
    setOverviewLoading(true);
    const poll = async () => {
      const [np, status, history, queue, playlists, files] = await Promise.all([
        getNowPlaying("1").catch(() => null),
        getStationStatus("1").catch(() => ({ backendRunning: false, frontendRunning: false })),
        getSongHistory(5).catch(() => []),
        apiGetQueue().catch(() => []),
        getPlaylists().catch(() => []),
        getStationFiles().catch(() => []),
      ]);
      if (np) {
        setOverviewNP(np);
        setListeners(np.listeners.current);
        setIsLive(np.live.isLive || (status?.backendRunning ?? false));
      }
      if (status) {
        setAutoDJ(status.backendRunning);
        setPcAutoDJ(status.backendRunning);
        setBackendRunning(status.backendRunning);
        setFrontendRunning(status.frontendRunning);
      }
      if (history) setOverviewHistory(history);
      if (queue) setPcQueue(queue);
      if (playlists) {
        setPcPlaylists(playlists);
        const active = playlists.find((p: Playlist) => p.enabled && !p.schedule && playlists.filter((o: Playlist) => o.enabled && !o.schedule).length === 1);
        setPcActivePlaylist(active?.id || null);
        if (!active) setPcActiveTrack("");
      }
      if (files) setPcFiles(files);
      setOverviewLoading(false);
    };
    poll();
    const interval = setInterval(poll, 10000);
    return () => clearInterval(interval);
  }, [activeTab]);

  const renderOverview = () => {
    const np = overviewNP?.nowPlaying;
    const progressPct = np && np.duration > 0 ? Math.round((np.elapsed / np.duration) * 100) : 0;
    const fmtTime = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
    const timeAgo = (iso: string) => {
      const diff = (Date.now() - new Date(iso).getTime()) / 1000;
      if (diff < 60) return "just now";
      if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
      return `${Math.floor(diff / 3600)}h ago`;
    };

    if (overviewLoading && !overviewNP) {
      return (
        <div className="overview-content">
          <div className="overview-cards-row">
            <div className="skeleton-card" style={{ flex: 1, padding: 16 }}>
              <div className="skeleton-loading skeleton-line w40 h24" style={{ marginBottom: 12 }}></div>
              <div className="skeleton-loading skeleton-line w60 h40" style={{ marginBottom: 8 }}></div>
              <div className="skeleton-loading skeleton-line w30" style={{ marginBottom: 4 }}></div>
            </div>
            <div className="skeleton-card" style={{ flex: 1, padding: 16 }}>
              <div className="skeleton-loading skeleton-line w40 h24" style={{ marginBottom: 12 }}></div>
              <div className="skeleton-loading skeleton-line w60 h40" style={{ marginBottom: 8 }}></div>
              <div className="skeleton-loading skeleton-line w30" style={{ marginBottom: 4 }}></div>
            </div>
          </div>
          <div className="skeleton-card" style={{ padding: 16, display: "flex", gap: 16, alignItems: "center", marginTop: 16 }}>
            <div className="skeleton-loading" style={{ width: 80, height: 80, borderRadius: "var(--radius-md)", flexShrink: 0 }}></div>
            <div style={{ flex: 1 }}>
              <div className="skeleton-loading skeleton-line w80 h24"></div>
              <div className="skeleton-loading skeleton-line w40"></div>
              <div className="skeleton-loading skeleton-line w60"></div>
            </div>
          </div>
          <div className="skeleton-block" style={{ marginTop: 16 }}>
            <div className="skeleton-loading skeleton-line w40 h24" style={{ marginBottom: 12 }}></div>
            <div className="skeleton-loading skeleton-line w80" style={{ marginBottom: 6 }}></div>
            <div className="skeleton-loading skeleton-line w60" style={{ marginBottom: 6 }}></div>
            <div className="skeleton-loading skeleton-line w80" style={{ marginBottom: 6 }}></div>
          </div>
        </div>
      );
    }

    return (
      <div className="overview-content">
        {/* Station Status + AutoDJ Row */}
        <div className="overview-cards-row">
          {/* Station Status Card */}
          <div className="status-card">
            <div className="status-card-header">
              <span className="status-card-label">Station</span>
              <div className={`status-badge ${isLive ? "live" : "offline"}`}>
                <span className={`status-dot ${isLive ? "pulse" : ""}`}></span>
                {isLive ? "Online" : "Offline"}
              </div>
            </div>
            <div className="status-card-body">
              <div className="status-card-info">
                <span className="status-card-stat">{listeners}</span>
                <span className="status-card-stat-label">Listeners</span>
              </div>
              <a href={overviewNP?.station ? `https://azuracast.histoview.co.ke/public/${overviewNP.station.shortName}` : "#"}
                target="_blank" rel="noopener noreferrer"
                className={`broadcast-ctrl-btn ${isLive ? "stop" : "start"}`}
                style={{ textDecoration: "none", textAlign: "center", lineHeight: "44px" }}>
                <i className="fas fa-external-link"></i> Public Page
              </a>
            </div>
          </div>

          {/* AutoDJ Status Card */}
          <div className="status-card">
            <div className="status-card-header">
              <span className="status-card-label">AutoDJ</span>
              <div className={`status-badge ${autoDJ ? "live" : "offline"}`}>
                <span className={`status-dot ${autoDJ ? "pulse" : ""}`}></span>
                {autoDJ ? "Running" : "Stopped"}
              </div>
            </div>
            <div className="status-card-body">
              <div className="status-card-info">
                <span className="status-card-stat">{overviewHistory.length}</span>
                <span className="status-card-stat-label">Recent Songs</span>
              </div>
              <button
                className={`broadcast-ctrl-btn ${autoDJ ? "stop" : "start"}`}
                onClick={() => {
                  const newAutoDJ = !autoDJ;
                  setAutoDJ(newAutoDJ);
                  toggleAutoDJ().catch(() => setAutoDJ(!newAutoDJ));
                }}
              >
                <i className={`fas ${autoDJ ? "fa-pause" : "fa-play"}`}></i>
                {autoDJ ? "Pause AutoDJ" : "Start AutoDJ"}
              </button>
            </div>
          </div>
        </div>

        {/* Now Playing Card */}
        <div className="now-playing-card">
          <div className="now-playing-cover">
            <img
              src={np?.song.albumArt || "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=120&h=120&fit=crop"}
              alt="Now Playing"
            />
            {backendRunning && (
              <div className="now-playing-equalizer">
                <span></span><span></span><span></span><span></span>
              </div>
            )}
          </div>
          <div className="now-playing-info">
            <div className="now-playing-title">{backendRunning && np?.song.title ? np.song.title : "Station Offline"}</div>
            <div className="now-playing-artist">{backendRunning && np?.song.artist ? np.song.artist : "Backend not running"}</div>
            {backendRunning && np && (
              <div className="now-playing-progress">
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${progressPct}%` }}></div>
                </div>
                <div className="progress-time">
                  <span>{fmtTime(np.elapsed)}</span>
                  <span>{fmtTime(np.duration)}</span>
                </div>
              </div>
            )}
          </div>
          <button
            className="mini-player-btn"
            onClick={() => {
              setIsPlaying(!isPlaying);
              if (isPlaying) {
                window.open(overviewNP?.station ? `https://azuracast.histoview.co.ke/public/${overviewNP.station.shortName}` : "#", "_blank");
              }
            }}
            title={backendRunning ? "" : "Station is offline"}
            disabled={!backendRunning}
          >
            <i className={`fas ${isPlaying ? "fa-stop" : "fa-play"}`}></i>
          </button>
        </div>

        {/* Quick Actions */}
        <div className="section-block">
          <div className="section-block-header">
            <h3>Quick Actions</h3>
          </div>
          <div className="quick-actions-row">
            <button className="quick-action-btn" onClick={() => setActiveTab("go-live")}>
              <div className="qab-icon gold"><i className="fas fa-microphone"></i></div>
              <span>Go Live</span>
            </button>
            <button className="quick-action-btn" onClick={() => setActiveTab("media")}>
              <div className="qab-icon blue"><i className="fas fa-cloud-arrow-up"></i></div>
              <span>Upload Media</span>
            </button>
            <button className="quick-action-btn" onClick={() => setActiveTab("playlists")}>
              <div className="qab-icon purple"><i className="fas fa-list"></i></div>
              <span>New Playlist</span>
            </button>
          </div>
        </div>

        {/* ========== PLAY CONTROL (integrated) ========== */}
        <div className="section-block">
          <div className="section-block-header">
            <h3><i className="fas fa-play-circle" style={{ marginRight: 6 }}></i>Play Control</h3>
            <span className="section-block-count" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span className={`ov-pc-dot ${pcAutoDJ ? "green" : "gray"}`}></span>
              AutoDJ: {pcAutoDJ ? "On" : "Off"}
            </span>
          </div>

          {/* Now Playing indicator (only when backend is broadcasting) */}
          {backendRunning && (pcActivePlaylist || pcActiveTrack) && (
            <div className="ov-pc-now-playing">
              <i className="fas fa-circle-play" style={{ color: "var(--success)" }}></i>
              {pcActiveTrack
                ? `Playing: ${pcActiveTrack}`
                : `Playing: ${pcPlaylists.find((p) => p.id === pcActivePlaylist)?.name || "Unknown"}`
              }
            </div>
          )}

          {/* Mode Selector */}
          <div className="ov-pc-mode-row">
            {([
              { id: "schedule" as const, label: "Schedule", icon: "fa-calendar-days" },
              { id: "playlist" as const, label: "Playlists", icon: "fa-list" },
              { id: "single" as const, label: "Single Track", icon: "fa-music" },
            ]).map((m) => (
              <button
                key={m.id}
                className={`ov-pc-mode-btn ${pcMode === m.id ? "active" : ""}`}
                onClick={() => setPcMode(m.id)}
              >
                <i className={`fas ${m.icon}`}></i>
                {m.label}
              </button>
            ))}
          </div>

          {/* Mode Content */}
          {pcMode === "schedule" && (
            <div className="ov-pc-list">
              {pcPlaylists.filter((p) => p.schedule).length === 0 ? (
                <div className="ov-pc-empty">No scheduled playlists</div>
              ) : (
                pcPlaylists.filter((p) => p.schedule).map((pl) => (
                  <div className="ov-pc-item" key={pl.id}>
                    <div className="ov-pc-item-info">
                      <div className="ov-pc-item-name">{pl.name}</div>
                      <div className="ov-pc-item-sub">
                        {pl.schedule!.days.map((d) => ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][d]).join(", ")}
                        &middot; {pl.schedule!.startTime} - {pl.schedule!.endTime}
                      </div>
                    </div>
                    <label className="pl-toggle" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" checked={pl.enabled}
                        disabled={pcActionLoading !== null}
                        onChange={async () => {
                          if (pcActionLoading) return;
                          setPcActionLoading(pl.id);
                          try {
                            const updated = await apiTogglePlaylist(pl.id);
                            setPcPlaylists((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
                          } catch {}
                          setPcActionLoading(null);
                        }}
                      />
                      <span className="pl-toggle-slider"></span>
                    </label>
                  </div>
                ))
              )}
            </div>
          )}

          {pcMode === "playlist" && (
            <div className="ov-pc-list">
              {pcActivePlaylist && (
                <div className="ov-pc-active">
                  <i className="fas fa-circle-play"></i>
                  Playing: {pcPlaylists.find((p) => p.id === pcActivePlaylist)?.name || "Unknown"}
                </div>
              )}
              {pcPlaylists.filter((p) => !p.schedule).length === 0 ? (
                <div className="ov-pc-empty">No playlists yet</div>
              ) : (
                pcPlaylists.filter((p) => !p.schedule).map((pl) => (
                  <div className="ov-pc-item" key={pl.id}>
                    <div className="ov-pc-item-info">
                      <div className="ov-pc-item-name">{pl.name}</div>
                      <div className="ov-pc-item-sub">{pl.songCount} songs &middot; weight {pl.weight}</div>
                    </div>
                    <button
                      className={`ov-pc-play-btn ${pcActivePlaylist === pl.id ? "active" : ""}`}
                      onClick={async () => {
                        if (pcActionLoading) return;
                        setPcActionLoading(pl.id);
                        const current = pcPlaylists;
                        for (const p of current) {
                          if (p.enabled !== (p.id === pl.id)) {
                            try { const u = await apiTogglePlaylist(p.id); setPcPlaylists((prev) => prev.map((pp) => (pp.id === u.id ? u : pp))); } catch {}
                          }
                        }
                        setPcActivePlaylist(pl.id);
                        setPcActionLoading(null);
                      }}
                      disabled={pcActivePlaylist === pl.id || pcActionLoading !== null}
                    >
                      <i className={`fas ${pcActionLoading === pl.id ? "fa-spinner fa-spin" : pcActivePlaylist === pl.id ? "fa-check" : "fa-play"}`}></i>
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {pcMode === "single" && (
            <div className="ov-pc-list">
              <div className="ov-pc-empty" style={{ fontSize: 12 }}>
                <i className="fas fa-info-circle"></i> Click a file to create a temp playlist and play it
              </div>
              {pcFiles.length === 0 ? (
                <div className="ov-pc-empty">No media files</div>
              ) : (
                pcFiles.map((f) => (
                  <div className="ov-pc-item" key={f.id}>
                    <div className="ov-pc-item-info">
                      <div className="ov-pc-item-name">{f.title || f.path}</div>
                      <div className="ov-pc-item-sub">{f.artist} &middot; {f.duration}</div>
                    </div>
                    <button className="ov-pc-play-btn" onClick={async () => {
                      if (pcActionLoading) return;
                      setPcActionLoading(f.id);
                      try {
                        let pl = pcPlaylists.find((p) => p.name === "__single__");
                        if (!pl) {
                          const created = await apiCreatePlaylist({ name: "__single__", type: "standard", order: "shuffle", weight: 1 });
                          pl = created;
                          setPcPlaylists((prev) => [...prev, created]);
                        }
                        await apiAddSongs(pl.id, [f.id]);
                        const current = pcPlaylists;
                        for (const p of current) {
                          if (p.enabled !== (p.id === pl!.id)) {
                            try { const u = await apiTogglePlaylist(p.id); setPcPlaylists((prev) => prev.map((pp) => (pp.id === u.id ? u : pp))); } catch {}
                          }
                        }
                        setPcActivePlaylist(pl.id);
                        setPcActiveTrack(f.title || f.path);
                        window.dispatchEvent(new CustomEvent("show-toast", {
                          detail: { title: "Playing", message: f.title, type: "success", duration: 2000 },
                        }));
                      } catch {}
                      setPcActionLoading(null);
                    }}
                      disabled={pcActionLoading !== null}
                    >
                      <i className={`fas ${pcActionLoading === f.id ? "fa-spinner fa-spin" : "fa-play"}`}></i>
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Queue */}
          <div className="ov-pc-queue-header">
            <span>Upcoming Queue</span>
            <span className="ov-pc-queue-count">{pcQueue.length} songs</span>
          </div>
          <div className="ov-pc-queue">
            {pcQueue.length === 0 ? (
              <div className="ov-pc-empty" style={{ padding: "8px 0" }}>No upcoming songs</div>
            ) : (
              pcQueue.slice(0, 5).map((item, i) => (
                <div className="ov-pc-q-item" key={i}>
                  <span className="ov-pc-q-num">{i + 1}</span>
                  <div className="ov-pc-q-info">
                    <div className="ov-pc-q-title">{item.song.title || "Unknown"}</div>
                    <div className="ov-pc-q-artist">{item.song.artist || "Unknown"}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  const [showConnInfo, setShowConnInfo] = useState(false);
  const renderGoLive = () => (
    <div className="go-live-content">
      {/* On Air Status Banner */}
      <div className={`gl-status-banner ${backendRunning ? "live" : "idle"}`}>
        <div className="gl-status-left">
          <span className={`gl-status-dot ${backendRunning ? "pulse-red" : ""}`}></span>
          <div>
            <span className="gl-status-text">
              {backendRunning ? "Station Online" : "Station Offline"}
            </span>
            <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 2 }}>
              {frontendRunning ? "Icecast running" : "Icecast stopped"}
              {backendRunning && nowPlayingTitle ? ` · ${nowPlayingArtist}` : ""}
            </div>
          </div>
        </div>
        <div className="gl-timer" style={{ color: "var(--text-secondary)" }}>
          <i className="fas fa-headphones"></i>
          {liveListeners} listeners
        </div>
      </div>

      {/* Web DJ Iframe */}
      <div className="gl-dj-frame-wrap">
        <iframe
          src="https://azuracast.histoview.co.ke/public/kingdom_seekers_church/dj"
          className="gl-dj-frame"
          allow="microphone; autoplay; fullscreen"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          title="Web DJ"
        />
      </div>

      {/* Connection Info — collapsible */}
      <button
        className="gl-conn-toggle"
        onClick={() => setShowConnInfo(!showConnInfo)}
      >
        <i className={`fas ${showConnInfo ? "fa-chevron-down" : "fa-chevron-right"}`}></i>
        {showConnInfo ? "Hide" : "Show"} Connection Info
        <span style={{ fontSize: 11, color: "var(--text-tertiary)", marginLeft: 4 }}>
          (for external streaming apps)
        </span>
      </button>

      {showConnInfo && (
        <div className="gl-tech-info">
          <div style={{ fontSize: 12, color: "var(--warning)", fontWeight: 600, marginBottom: 4 }}>
            <i className="fas fa-exclamation-triangle"></i> Behind CloudFlare — use origin server IP
          </div>
          <div className="gl-tech-row">
            <span>Method 1 — Icecast Source</span>
            <span className="gl-tech-value" style={{ fontSize: 10 }}>port {sourceInfo?.sourcePort || 9100}</span>
          </div>
          <div className="gl-tech-row" style={{ paddingLeft: 12 }}>
            <span>Server</span>
            <span className="gl-tech-value">{sourceInfo?.serverHost || "azuracast.histoview.co.ke"}:{sourceInfo?.sourcePort || 9100}</span>
          </div>
          <div className="gl-tech-row" style={{ paddingLeft: 12 }}>
            <span>Mount</span>
            <span className="gl-tech-value">{sourceInfo?.mountPoint || "/radio.mp3"}</span>
          </div>
          <div className="gl-tech-row" style={{ paddingLeft: 12 }}>
            <span>Username</span>
            <span className="gl-tech-value">source</span>
          </div>
          <div className="gl-tech-row" style={{ paddingLeft: 12 }}>
            <span>Password</span>
            <span className="gl-tech-value">{sourceInfo?.sourcePassword || "changeme"}</span>
          </div>
          <div style={{ borderTop: "1px solid var(--border)", margin: "6px 0" }} />
          <div className="gl-tech-row">
            <span>Method 2 — DJ Account</span>
            <span className="gl-tech-value" style={{ fontSize: 10 }}>port {sourceInfo?.djPort || 9105}</span>
          </div>
          <div className="gl-tech-row" style={{ paddingLeft: 12 }}>
            <span>Server</span>
            <span className="gl-tech-value">{sourceInfo?.serverHost || "azuracast.histoview.co.ke"}:{sourceInfo?.djPort || 9105}</span>
          </div>
          <div className="gl-tech-row" style={{ paddingLeft: 12 }}>
            <span>Mount</span>
            <span className="gl-tech-value">{sourceInfo?.djMountPoint || "/"}</span>
          </div>
          <div className="gl-tech-row" style={{ paddingLeft: 12 }}>
            <span>Username</span>
            <span className="gl-tech-value">{selectedStreamerId ? (djName || "DJ username") : "select a DJ first"}</span>
          </div>
          <div className="gl-tech-row" style={{ paddingLeft: 12 }}>
            <span>Password</span>
            <span className="gl-tech-value">DJ account password</span>
          </div>
          <div style={{ borderTop: "1px solid var(--border)", margin: "6px 0" }} />
          <div className="gl-tech-row">
            <span>Quality</span>
            <span className="gl-tech-value">{streamQuality} kbps</span>
          </div>
          <div className="gl-tech-row">
            <span>Backend</span>
            <span className="gl-tech-value" style={{ color: backendRunning ? "var(--success)" : "var(--error)" }}>
              {backendRunning ? "Running" : "Stopped"}
            </span>
          </div>
        </div>
      )}
    </div>
  );

  const renderMedia = () => {
    const filteredFiles = stationFiles.filter((f) => {
      const matchesSearch =
        !mediaSearch ||
        f.title.toLowerCase().includes(mediaSearch.toLowerCase()) ||
        f.artist.toLowerCase().includes(mediaSearch.toLowerCase()) ||
        f.album.toLowerCase().includes(mediaSearch.toLowerCase());
      const matchesPlaylist =
        !mediaFilterPlaylist ||
        f.playlists.includes(mediaFilterPlaylist);
      return matchesSearch && matchesPlaylist;
    });

    const allSelected = filteredFiles.length > 0 && filteredFiles.every((f) => selectedFileIds.has(f.id));

    const toggleFileSelect = (id: string) => {
      const next = new Set(selectedFileIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      setSelectedFileIds(next);
    };

    const toggleSelectAll = () => {
      if (allSelected) {
        setSelectedFileIds(new Set());
      } else {
        setSelectedFileIds(new Set(filteredFiles.map((f) => f.id)));
      }
    };

    const startEdit = (file: StationFile) => {
      setEditingFile(file.id);
      setEditTitle(file.title);
      setEditArtist(file.artist);
      setEditAlbum(file.album);
    };

    const saveEdit = async () => {
      if (!editingFile || mediaActionLoading) return;
      setMediaActionLoading(true);
      await updateFileMetadata(editingFile, {
        title: editTitle,
        artist: editArtist,
        album: editAlbum,
      }).catch(() => {});
      setStationFiles((prev) =>
        prev.map((f) =>
          f.id === editingFile
            ? { ...f, title: editTitle, artist: editArtist, album: editAlbum }
            : f
        )
      );
      window.dispatchEvent(
        new CustomEvent("show-toast", {
          detail: { title: "Metadata Saved", message: `"${editTitle}" updated successfully`, type: "success", duration: 2500 },
        })
      );
      setEditingFile(null);
      setMediaActionLoading(false);
    };

    const cancelEdit = () => {
      setEditingFile(null);
    };

    const handleDeleteFile = async () => {
      if (!showMediaActions || mediaActionLoading) return;
      setMediaActionLoading(true);
      const file = stationFiles.find((f) => f.id === showMediaActions);
      if (file) {
        await deleteFile(file.id).catch(() => {});
        setStationFiles((prev) => prev.filter((f) => f.id !== file.id));
      }
      window.dispatchEvent(
        new CustomEvent("show-toast", {
          detail: { title: "File Deleted", message: "Track removed from media library", type: "success", duration: 2500 },
        })
      );
      setShowMediaActions(null);
      setMediaActionLoading(false);
    };

    const handleBulkDelete = async () => {
      if (selectedFileIds.size === 0 || mediaActionLoading) return;
      setMediaActionLoading(true);
      const filesToDelete = stationFiles.filter((f) => selectedFileIds.has(f.id));
      const filePaths = filesToDelete.map((f) => f.path).filter(Boolean);
      if (filePaths.length > 0) {
        await deleteStationFiles(filePaths).catch(() => {});
      }
      setStationFiles((prev) => prev.filter((f) => !selectedFileIds.has(f.id)));
      window.dispatchEvent(
        new CustomEvent("show-toast", {
          detail: { title: "Files Deleted", message: `${selectedFileIds.size} tracks removed`, type: "success", duration: 2500 },
        })
      );
      setSelectedFileIds(new Set());
      setMediaActionLoading(false);
    };

    const handleBulkAddPlaylist = () => {
      if (selectedFileIds.size === 0) return;
      setPlaylistPickerOpen(true);
    };

    const addToPlaylist = async (playlistId: string) => {
      if (mediaActionLoading) return;
      setMediaActionLoading(true);
      const pl = playlists.find((p) => p.id === playlistId);
      const plNumId = parseInt(playlistId);
      for (const fid of selectedFileIds) {
        const file = stationFiles.find((f) => f.id === fid);
        if (!file) continue;
        const currentIds = [...file.playlists];
        if (!currentIds.includes(playlistId)) currentIds.push(playlistId);
        await updateFileMetadata(fid, { playlists: currentIds.map(Number) }).catch(() => {});
      }
      setStationFiles((prev) =>
        prev.map((f) =>
          selectedFileIds.has(f.id)
            ? { ...f, playlists: f.playlists.includes(playlistId) ? f.playlists : [...f.playlists, playlistId] }
            : f
        )
      );
      window.dispatchEvent(
        new CustomEvent("show-toast", {
          detail: { title: "Added to Playlist", message: `${selectedFileIds.size} tracks added to "${pl?.name || ""}"`, type: "success", duration: 2500 },
        })
      );
      setPlaylistPickerOpen(false);
      setSelectedFileIds(new Set());
      setMediaActionLoading(false);
    };

    const simulateUpload = async (files?: FileList) => {
      if (files && files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const id = "upload_" + Date.now() + "_" + i;
          setUploadProgress((prev) => [...prev, { id, name: file.name, progress: 0 }]);
          const uploaded = await uploadFile(file).catch(() => null);
          if (uploaded) {
            setUploadProgress((prev) =>
              prev.map((u) => (u.id === id ? { ...u, progress: 100 } : u))
            );
            setStationFiles((prev) => [...prev, uploaded]);
          } else {
            setUploadProgress((prev) => prev.filter((u) => u.id !== id));
          }
        }
        const count = files.length;
        window.dispatchEvent(
          new CustomEvent("show-toast", {
            detail: { title: "Upload Complete", message: `${count} file${count > 1 ? "s" : ""} uploaded`, type: "success", duration: 3000 },
          })
        );
        return;
      }
      // Fallback: simulate upload with progress (for drag-drop without real files)
      const id = "upload_" + Date.now();
      const name = "New_Sermon.mp3";
      setUploadProgress((prev) => [...prev, { id, name, progress: 0 }]);
      const interval = setInterval(() => {
        setUploadProgress((prev) =>
          prev.map((u) =>
            u.id === id ? { ...u, progress: Math.min(100, u.progress + Math.random() * 15 + 3) } : u
          )
        );
      }, 300);
      setTimeout(async () => {
        clearInterval(interval);
        setUploadProgress((prev) => prev.filter((u) => u.id !== id));
        window.dispatchEvent(
          new CustomEvent("show-toast", {
            detail: { title: "Upload Complete", message: `"${name}" added to media library`, type: "success", duration: 3000 },
          })
        );
      }, 3000);
    };

    return (
      <div className="media-content">
        {/* Upload Zone */}
        <div
          className={`upload-zone ${dragging ? "dragging" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files?.length) simulateUpload(e.dataTransfer.files); }}
          onClick={() => document.getElementById("media-file-input")?.click()}
        >
          <i className={`fas ${dragging ? "fa-file-circle-plus" : "fa-cloud-arrow-up"}`}></i>
          <div className="upload-zone-text">
            <h4>{dragging ? "Drop files here" : "Tap to Upload or Drag & Drop"}</h4>
            <p>MP3, AAC, OGG, FLAC — up to 50MB</p>
          </div>
          <input
            id="media-file-input"
            type="file"
            accept="audio/*"
            multiple
            style={{ display: "none" }}
            onChange={(e) => { if (e.target.files?.length) { simulateUpload(e.target.files); e.target.value = ""; } }}
          />
        </div>

        {/* Upload Progress */}
        {uploadProgress.length > 0 && (
          <div className="upload-progress-list">
            {uploadProgress.map((u) => (
              <div className="upload-progress-item" key={u.id}>
                <div className="upload-progress-info">
                  <span className="upload-progress-name"><i className="fas fa-file-audio"></i> {u.name}</span>
                  <span className="upload-progress-pct">{Math.round(u.progress)}%</span>
                </div>
                <div className="upload-progress-bar">
                  <div className="upload-progress-fill" style={{ width: `${u.progress}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Search & Filter */}
        <div className="media-toolbar">
          <div className="media-search-wrapper">
            <i className="fas fa-search"></i>
            <input
              type="text"
              className="media-search-input"
              placeholder="Search by title, artist, album..."
              value={mediaSearch}
              onChange={(e) => setMediaSearch(e.target.value)}
            />
            {mediaSearch && (
              <button className="media-search-clear" onClick={() => setMediaSearch("")}>
                <i className="fas fa-xmark"></i>
              </button>
            )}
          </div>
          <select
            className="media-filter-select"
            value={mediaFilterPlaylist}
            onChange={(e) => setMediaFilterPlaylist(e.target.value)}
          >
            <option value="">All Playlists</option>
            {playlists.map((pl) => (
              <option key={pl.id} value={pl.id}>{pl.name}</option>
            ))}
          </select>
        </div>

        {/* Bulk Actions Bar */}
        {selectedFileIds.size > 0 && (
          <div className="media-bulk-bar">
            <span className="media-bulk-count">{selectedFileIds.size} selected</span>
            <div className="media-bulk-actions">
              <button className="media-bulk-btn" onClick={handleBulkAddPlaylist} disabled={mediaActionLoading}>
                {mediaActionLoading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-list"></i>} Add to Playlist
              </button>
              <button className="media-bulk-btn danger" onClick={handleBulkDelete} disabled={mediaActionLoading}>
                {mediaActionLoading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-trash-can"></i>} Delete
              </button>
            </div>
            <button className="media-bulk-clear" onClick={() => setSelectedFileIds(new Set())}>
              <i className="fas fa-xmark"></i>
            </button>
          </div>
        )}

        {/* File Count */}
        <div className="media-count">
          {filteredFiles.length} of {stationFiles.length} files
        </div>

        {/* File List */}
        <div className="media-file-list">
          {filteredFiles.length === 0 ? (
            <div className="media-empty">
              <i className="fas fa-music"></i>
              <p>No files found matching your search</p>
            </div>
          ) : (
            filteredFiles.map((file) => {
              const isEditing = editingFile === file.id;
              const isSelected = selectedFileIds.has(file.id);
              return (
                <div className={`media-file-item ${isSelected ? "selected" : ""}`} key={file.id}>
                  {/* Checkbox */}
                  <div
                    className={`media-checkbox ${isSelected ? "checked" : ""}`}
                    onClick={() => toggleFileSelect(file.id)}
                  >
                    {isSelected && <i className="fas fa-check"></i>}
                  </div>

                  {/* Album Art */}
                  <div className="media-file-cover">
                    <img src={file.albumArt || "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=60&h=60&fit=crop"} alt={file.title} />
                  </div>

                  {/* File Info */}
                  <div className="media-file-info">
                    {isEditing ? (
                      <div className="media-edit-fields">
                        <input
                          className="media-edit-input"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          placeholder="Title"
                          autoFocus
                        />
                        <input
                          className="media-edit-input"
                          value={editArtist}
                          onChange={(e) => setEditArtist(e.target.value)}
                          placeholder="Artist"
                        />
                        <input
                          className="media-edit-input"
                          value={editAlbum}
                          onChange={(e) => setEditAlbum(e.target.value)}
                          placeholder="Album"
                        />
                        <div className="media-edit-actions">
                          <button className="media-edit-save" onClick={saveEdit} disabled={mediaActionLoading}>
                            {mediaActionLoading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-check"></i>} Save
                          </button>
                          <button className="media-edit-cancel" onClick={cancelEdit} disabled={mediaActionLoading}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="media-file-title">{file.title}</div>
                        <div className="media-file-artist">{file.artist} · {file.album}</div>
                        <div className="media-file-tags">
                          <span className="media-file-tag">{file.genre}</span>
                          <span className="media-file-tag">{file.duration}</span>
                          <span className="media-file-tag">{file.size}</span>
                        </div>
                        <div className="media-file-playlists">
                          {file.playlists.map((plId) => {
                            const pl = playlists.find((p) => p.id === plId);
                            return pl ? (
                              <span className="media-playlist-chip" key={plId}>{pl.name}</span>
                            ) : null;
                          })}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="media-file-actions-relative">
                    <button
                      className="media-file-menu"
                      onClick={(e) => {
                        if (showMediaActions === file.id) {
                          setShowMediaActions(null);
                          setMenuPos(null);
                        } else {
                          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                          setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
                          setShowMediaActions(file.id);
                        }
                      }}
                    >
                      <i className="fas fa-ellipsis-h"></i>
                    </button>

                    {showMediaActions === file.id && menuPos && (
                      <>
                        <div className="media-actions-overlay" onClick={() => { setShowMediaActions(null); setMenuPos(null); }}></div>
                        <div className="media-actions-sheet" style={{ position: "fixed", top: menuPos.top, right: menuPos.right, left: "auto", bottom: "auto" }}>                          <button className="media-action-btn" onClick={() => { startEdit(file); setShowMediaActions(null); setMenuPos(null); }}>
                            <span className="media-action-icon blue"><i className="fas fa-pen"></i></span>
                            <div className="media-action-info">
                              <h4>Edit Metadata</h4>
                              <p>Change title, artist, album, genre</p>
                            </div>
                          </button>
                          <button className="media-action-btn" onClick={() => { setSelectedFileIds(new Set([file.id])); setPlaylistPickerOpen(true); setShowMediaActions(null); setMenuPos(null); }}>
                            <span className="media-action-icon gold"><i className="fas fa-list"></i></span>
                            <div className="media-action-info">
                              <h4>Add to Playlist</h4>
                              <p>Include in a program rotation</p>
                            </div>
                          </button>
                          <button className="media-action-btn" onClick={() => { handleDeleteFile(); setMenuPos(null); }} disabled={mediaActionLoading}>
                            <span className="media-action-icon red">{mediaActionLoading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-trash-can"></i>}</span>
                            <div className="media-action-info">
                              <h4>Delete</h4>
                              <p>Permanently remove this file</p>
                            </div>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Playlist Picker Modal */}
        {playlistPickerOpen && (
          <>
            <div className="media-modal-overlay" onClick={() => setPlaylistPickerOpen(false)}></div>
            <div className="media-modal-sheet">
              <div className="media-modal-handle"></div>
              <div className="media-modal-header">
                <h2>Add to Playlist</h2>
                <p>Select a playlist for {selectedFileIds.size} track{selectedFileIds.size !== 1 ? "s" : ""}</p>
              </div>
              <div className="media-modal-body">
                {playlists.map((pl) => (
                  <div
                    className="media-pl-item"
                    key={pl.id}
                    onClick={() => addToPlaylist(pl.id)}
                    style={{ opacity: mediaActionLoading ? 0.6 : 1, pointerEvents: mediaActionLoading ? "none" : "auto" }}
                  >
                    <div className="media-pl-icon">
                      {mediaActionLoading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-list"></i>}
                    </div>
                    <div className="media-pl-info">
                      <div className="media-pl-name">{pl.name}</div>
                    </div>
                    <i className="fas fa-chevron-right media-pl-arrow"></i>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  // ========== PLAYLISTS SECTION ==========
  const renderPlaylists = () => {
    const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
    const plSongsFor = (plId: string) =>
      stationFiles.filter((f) => f.playlists.includes(plId));

    const createPlaylist = async () => {
      if (plActionLoading) return;
      setPlActionLoading(true);
      try {
        const newPl = await apiCreatePlaylist({
          name: plForm.name || "New Playlist",
          type: plCreateType,
          order: plCreateOrder,
          weight: plForm.weight,
          schedule: plCreateType === "scheduled"
            ? { days: plSchedule.days.map((d: string) => DAYS.indexOf(d)), startTime: plSchedule.startTime, endTime: plSchedule.endTime }
            : undefined,
        });
        setPlaylists([...playlists, newPl]);
        setShowCreatePlaylist(false);
        setPlForm({ name: "", type: "standard", order: "shuffle", weight: 10 });
        setPlSchedule({ days: [], startTime: "09:00", endTime: "17:00" });
        window.dispatchEvent(new CustomEvent("show-toast", { detail: { title: "Playlist Created", message: `"${newPl.name}" created successfully`, type: "success", duration: 2500 } }));
      } catch {
        window.dispatchEvent(new CustomEvent("show-toast", { detail: { title: "Error", message: "Failed to create playlist — try again", type: "error", duration: 3000 } }));
      }
      setPlActionLoading(false);
    };

    const saveEditedPlaylist = async () => {
      if (!editingPlId || plActionLoading) return;
      setPlActionLoading(true);
      try {
        const updated = await apiUpdatePlaylist(editingPlId, {
          name: plForm.name,
          type: plCreateType,
          order: plCreateOrder,
          weight: plForm.weight,
          schedule: plCreateType === "scheduled"
            ? { days: plSchedule.days.map((d: string) => DAYS.indexOf(d)), startTime: plSchedule.startTime, endTime: plSchedule.endTime }
            : undefined,
        });
        setPlaylists(playlists.map((p) => p.id === editingPlId ? { ...p, ...updated } : p));
        setShowEditPlModal(false);
        setEditingPlId(null);
        window.dispatchEvent(new CustomEvent("show-toast", { detail: { title: "Changes Saved", message: "Playlist updated", type: "success", duration: 2500 } }));
      } catch {
        window.dispatchEvent(new CustomEvent("show-toast", { detail: { title: "Error", message: "Failed to update playlist", type: "error", duration: 3000 } }));
      }
      setPlActionLoading(false);
    };

    const togglePlaylistEnabled = async (id: string) => {
      if (plActionLoading) return;
      setPlActionLoading(true);
      try {
        const updated = await apiTogglePlaylist(id);
        setPlaylists(playlists.map((p) => p.id === id ? updated : p));
      } catch {
        window.dispatchEvent(new CustomEvent("show-toast", { detail: { title: "Error", message: "Failed to toggle playlist", type: "error", duration: 3000 } }));
      }
      setPlActionLoading(false);
    };

    const deletePlaylist = async (id: string) => {
      if (plActionLoading) return;
      setPlActionLoading(true);
      try {
        await apiDeletePlaylist(id);
        setPlaylists(playlists.filter((p) => p.id !== id));
        if (selectedPlId === id) setSelectedPlId(null);
        window.dispatchEvent(new CustomEvent("show-toast", { detail: { title: "Playlist Deleted", message: "Playlist removed", type: "success", duration: 2500 } }));
      } catch {
        window.dispatchEvent(new CustomEvent("show-toast", { detail: { title: "Error", message: "Failed to delete playlist", type: "error", duration: 3000 } }));
      }
      setPlActionLoading(false);
      setPlConfirmDelete(null);
    };

    const removeSongFromPlaylist = async (plId: string, songId: string) => {
      if (plActionLoading) return;
      setPlActionLoading(true);
      try {
        await apiRemoveSong(plId, songId);
        setStationFiles(stationFiles.map((f) =>
          f.id === songId ? { ...f, playlists: f.playlists.filter((p) => p !== plId) } : f
        ));
        window.dispatchEvent(new CustomEvent("show-toast", { detail: { title: "Song Removed", message: "Song removed from playlist", type: "success", duration: 2500 } }));
      } catch {
        window.dispatchEvent(new CustomEvent("show-toast", { detail: { title: "Error", message: "Failed to remove song", type: "error", duration: 3000 } }));
      }
      setPlActionLoading(false);
    };

    const addSongsToPlaylist = async () => {
      if (!addSongsPlId || addSongsSelected.size === 0 || plActionLoading) return;
      setPlActionLoading(true);
      try {
        await apiAddSongs(addSongsPlId, [...addSongsSelected]);
        setStationFiles(stationFiles.map((f) =>
          addSongsSelected.has(f.id) && !f.playlists.includes(addSongsPlId)
            ? { ...f, playlists: [...f.playlists, addSongsPlId] }
            : f
        ));
        window.dispatchEvent(new CustomEvent("show-toast", { detail: { title: "Songs Added", message: `${addSongsSelected.size} songs added to playlist`, type: "success", duration: 2500 } }));
        setShowSongPicker(false);
        setAddSongsPlId(null);
        setAddSongsSearch("");
        setAddSongsSelected(new Set());
      } catch {
        window.dispatchEvent(new CustomEvent("show-toast", { detail: { title: "Error", message: "Something went wrong — try again", type: "error", duration: 3000 } }));
      }
      setPlActionLoading(false);
    };

    const toggleScheduleDay = (day: string) => {
      setPlSchedule((prev) => ({
        ...prev,
        days: prev.days.includes(day) ? prev.days.filter((d) => d !== day) : [...prev.days, day],
      }));
    };

    const refreshPlaylistData = async () => {
      setLoadingPlaylists(true);
      await Promise.all([
        getPlaylists().then(setPlaylists),
        getStationFiles().then(setStationFiles),
      ]).catch(() => {}).finally(() => setLoadingPlaylists(false));
    };

    // Filter & status helpers
    const countByType = (type: string) => type === "all" ? playlists.length : playlists.filter((p) => p.type === type).length;
    const filteredByTab = playlists.filter((p) => plFilterTab === "all" || p.type === plFilterTab);
    const filteredPlaylists = filteredByTab.filter(
      (p) => !playlistFilter || p.name.toLowerCase().includes(playlistFilter.toLowerCase())
    );
    const getStatus = (pl: Playlist): "active" | "scheduled" | "general" | "disabled" => {
      if (!pl.enabled) return "disabled";
      if (pl.enabled && pl.type === "standard") return "general";
      if (pl.type === "scheduled") return "scheduled";
      return "general";
    };

    const selectedPl = selectedPlId ? playlists.find((p) => p.id === selectedPlId) : null;
    const selectedSongs = selectedPl ? plSongsFor(selectedPl.id) : [];
    const defaultPl = playlists.find((p) => p.name === "Default");
    const scheduledPlaylists = playlists.filter((p) => p.type === "scheduled" && p.schedule);
    const playlistColors: Record<string, string> = {};
    scheduledPlaylists.forEach((pl, i) => {
      const palette = ["#E8A838","#3B82F6","#8B5CF6","#10B981","#F43F5E","#14B8A6","#F97316"];
      playlistColors[pl.id] = palette[i % palette.length];
    });

    // Open edit modal with pre-filled data
    const openEditModal = (pl: Playlist) => {
      setEditingPlId(pl.id);
      setPlForm({ name: pl.name, type: pl.type, order: pl.order, weight: pl.weight });
      setPlCreateType(pl.type);
      setPlCreateOrder(pl.order);
      if (pl.schedule) {
        setPlSchedule({ days: pl.schedule.days.map((d) => DAYS[d] || DAYS[0]), startTime: pl.schedule.startTime, endTime: pl.schedule.endTime });
      } else {
        setPlSchedule({ days: [], startTime: "09:00", endTime: "17:00" });
      }
      setShowEditPlModal(true);
    };

    if (loadingPlaylists) {
      return (
        <div className="pl-content">
          <div style={{ padding: "16px 0" }}>
            <div className="skeleton-loading skeleton-line w40 h24" style={{ marginBottom: 16 }}></div>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <div className="skeleton-loading skeleton-line w20 h32" style={{ borderRadius: 8 }}></div>
              <div className="skeleton-loading skeleton-line w20 h32" style={{ borderRadius: 8 }}></div>
              <div className="skeleton-loading skeleton-line w20 h32" style={{ borderRadius: 8 }}></div>
            </div>
            {[1,2,3].map((i) => (
              <div key={i} className="skeleton-card" style={{ padding: 14, marginBottom: 10, display: "flex", alignItems: "center", gap: 12 }}>
                <div className="skeleton-loading" style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0 }}></div>
                <div style={{ flex: 1 }}>
                  <div className="skeleton-loading skeleton-line w60 h20" style={{ marginBottom: 6 }}></div>
                  <div className="skeleton-loading skeleton-line w40"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    const nowPlayingPlaylistId = pcActivePlaylist;

    return (
      <div className="pl-content-new">
        {/* Top Header */}
        <div className="pl-new-header">
          <h2 className="pl-new-heading">Playlists</h2>
          <button className="pl-create-btn" onClick={() => { setShowCreatePlaylist(true); setPlCreateType("standard"); setPlCreateOrder("shuffle"); setPlForm({ name: "", type: "standard", order: "shuffle", weight: 10 }); setPlSchedule({ days: [], startTime: "09:00", endTime: "17:00" }); }}>
            <i className="fas fa-plus"></i> New Playlist
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="pl-filter-tabs">
          {[
            { id: "all", label: "All" },
            { id: "scheduled", label: "Scheduled" },
            { id: "standard", label: "General" },
            { id: "on_demand", label: "On Demand" },
          ].map((tab) => (
            <button
              key={tab.id}
              className={`pl-filter-tab ${plFilterTab === tab.id ? "active" : ""}`}
              onClick={() => { setPlFilterTab(tab.id); setSelectedPlId(null); }}
            >
              {tab.label}
              {countByType(tab.id) > 0 && <span className="pl-filter-count">{countByType(tab.id)}</span>}
            </button>
          ))}
          <div className="pl-search-wrapper" style={{ marginLeft: "auto", maxWidth: 200 }}>
            <i className="fas fa-search"></i>
            <input type="text" className="pl-search-input" placeholder="Search..." value={playlistFilter}
              onChange={(e) => setPlaylistFilter(e.target.value)} />
          </div>
        </div>

        {/* Schedule View Toggle (only when Scheduled tab is active) */}
        {plFilterTab === "scheduled" && (
          <div className="pl-sched-view-toggle">
            <button
              className={`pl-sched-toggle-btn ${showScheduleView ? "active" : ""}`}
              onClick={() => setShowScheduleView(!showScheduleView)}
            >
              <i className={`fas ${showScheduleView ? "fa-list" : "fa-calendar-week"}`}></i>
              {showScheduleView ? "List View" : "Schedule View"}
            </button>
          </div>
        )}

        {/* Schedule View (calendar grid) */}
        {plFilterTab === "scheduled" && showScheduleView && (
          <div className="pl-schedule-view">
            <div className="pl-sv-header">
              <h3 className="pl-sv-title">Weekly Schedule</h3>
            </div>
            <div className="pl-sv-grid-wrapper">
              <div className="pl-sv-grid">
                {/* Time labels column + 7 day columns */}
                <div className="pl-sv-corner"></div>
                {DAYS.map((d, i) => {
                  const todayIdx = new Date().getDay();
                  const dayNum = i === 6 ? 0 : i + 1;
                  const isToday = dayNum === todayIdx;
                  return (
                    <div key={d} className={`pl-sv-day-header ${isToday ? "today" : ""}`}>
                      {d}
                    </div>
                  );
                })}
                {/* 24 hour rows */}
                {Array.from({ length: 24 }, (_, hour) => (
                  <React.Fragment key={hour}>
                    <div className="pl-sv-time">{hour === 0 ? "12AM" : hour < 12 ? `${hour}AM` : hour === 12 ? "12PM" : `${hour - 12}PM`}</div>
                    {DAYS.map((d, dayIdx) => {
                      const dayNum = dayIdx === 6 ? 0 : dayIdx + 1;
                      const todayIdx = new Date().getDay();
                      const isToday = dayNum === todayIdx;
                      const hourStart = `${String(hour).padStart(2, "0")}:00`;
                      const hourEnd = `${String(hour + 1).padStart(2, "0")}:00`;
                      const blocks = scheduledPlaylists.filter((pl) => {
                        if (!pl.schedule) return false;
                        return pl.schedule.days.includes(dayNum) &&
                          pl.schedule.startTime <= hourEnd &&
                          pl.schedule.endTime > hourStart;
                      });
                      return (
                        <div key={`${d}-${hour}`} className={`pl-sv-cell ${isToday ? "today" : ""} ${blocks.length > 0 ? "has-block" : ""}`}
                          style={blocks.length > 0 ? { background: `rgba(232,168,56,${Math.min(0.08 * blocks.length, 0.25)})` } : {}}>
                          {blocks.map((pl) => (
                            <div
                              key={pl.id}
                              className="pl-sv-block"
                              style={{ background: playlistColors[pl.id] || "#E8A838" }}
                              title={`${pl.name} (${pl.schedule!.startTime} - ${pl.schedule!.endTime})`}
                              onClick={() => setSelectedPlId(pl.id)}
                            >
                              {pl.name}
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Two-Panel Layout (only when not showing schedule view, or when not on scheduled tab) */}
        {!(plFilterTab === "scheduled" && showScheduleView) && (
        <div className="pl-two-panel">
          {/* LEFT PANEL */}
          <div className={`pl-left-panel ${selectedPlId ? "pl-left-compact" : ""}`}>
            {playlists.length === 0 ? (
              <div className="pl-empty-state">
                <i className="fas fa-list"></i>
                <h4>No playlists yet</h4>
                <p>Create your first playlist to start organizing your music</p>
                <button className="pl-create-btn" onClick={() => { setShowCreatePlaylist(true); setPlCreateType("standard"); setPlForm({ name: "", type: "standard", order: "shuffle", weight: 10 }); }}>
                  <i className="fas fa-plus"></i> Create Playlist
                </button>
              </div>
            ) : filteredPlaylists.length === 0 ? (
              <div className="pl-empty-state">
                <i className="fas fa-filter"></i>
                <p>No playlists match this filter</p>
              </div>
            ) : (
              <div className="pl-card-list">
                {filteredPlaylists.map((pl) => {
                  const isSelected = selectedPlId === pl.id;
                  const isPlaying = nowPlayingPlaylistId === pl.id;
                  const status = getStatus(pl);
                  const songs = plSongsFor(pl.id);
                  const totalDuration = songs.reduce((acc, s) => {
                    const mins = parseInt(s.duration) || 0;
                    return acc + mins;
                  }, 0);
                  return (
                    <div
                      key={pl.id}
                      className={`pl-card-new ${isSelected ? "selected" : ""} ${isPlaying ? "now-playing" : ""} ${pl.name === "Default" ? "default" : ""}`}
                      onClick={() => setSelectedPlId(isSelected ? null : pl.id)}
                    >
                      <div className={`pl-card-status-dot ${status}`}></div>
                      <div className="pl-card-new-body">
                        <div className="pl-card-new-top">
                          <div className="pl-card-new-name">{pl.name}</div>
                          <span className={`pl-type-badge ${pl.type}`}>{pl.type === "on_demand" ? "On Demand" : pl.type === "scheduled" ? "Scheduled" : "General"}</span>
                        </div>
                        <div className="pl-card-new-meta">
                          {pl.songCount} songs
                          {pl.schedule && <span> · {pl.schedule.days.map((d: number) => DAYS[d] || DAYS[0]).join(", ")} · {pl.schedule.startTime}–{pl.schedule.endTime}</span>}
                          {!pl.schedule && <span> · {pl.type === "standard" ? "Always playing as fallback" : "Triggered manually"}</span>}
                        </div>
                        {pl.name === "Default" && (
                          <div className="pl-card-new-tag">
                            <i className="fas fa-thumbtack"></i> Fallback playlist — always keep active
                          </div>
                        )}
                      </div>
                      <div className="pl-card-new-actions" onClick={(e) => e.stopPropagation()}>
                        <button className="pl-card-edit-btn" onClick={() => openEditModal(pl)}>
                          <i className="fas fa-pen"></i>
                        </button>
                        <div className="pl-card-menu-wrapper">
                          <button className="pl-card-menu-btn" onClick={() => setPlMenuOpen(plMenuOpen === pl.id ? null : pl.id)}>
                            <i className="fas fa-ellipsis"></i>
                          </button>
                          {plMenuOpen === pl.id && (
                            <>
                              <div className="pl-menu-overlay" onClick={() => setPlMenuOpen(null)}></div>
                              <div className="pl-menu-dropdown">
                                <button className="pl-menu-item" onClick={() => { togglePlaylistEnabled(pl.id); setPlMenuOpen(null); }}>
                                  <i className={`fas ${pl.enabled ? "fa-pause" : "fa-play"}`}></i>
                                  {pl.enabled ? "Disable" : "Enable"}
                                </button>
                                {pl.name !== "Default" && (
                                  <button className="pl-menu-item danger" onClick={() => { setPlConfirmDelete(pl.id); setPlMenuOpen(null); }}>
                                    <i className="fas fa-trash-can"></i> Delete
                                  </button>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                      {isPlaying && <div className="pl-card-now-playing-badge">Now Playing</div>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* RIGHT PANEL */}
          {selectedPl && (
            <div className="pl-right-panel">
              {/* Header */}
              <div className="pl-detail-header">
                <button className="pl-detail-back" onClick={() => setSelectedPlId(null)}>
                  <i className="fas fa-chevron-left"></i>
                </button>
                <div className="pl-detail-header-info">
                  <div className="pl-detail-name">{selectedPl.name}</div>
                  <span className={`pl-type-badge ${selectedPl.type}`}>{selectedPl.type === "on_demand" ? "On Demand" : selectedPl.type === "scheduled" ? "Scheduled" : "General"}</span>
                </div>
                <div className="pl-detail-header-actions">
                  <label className="pl-toggle">
                    <input type="checkbox" checked={selectedPl.enabled} disabled={plActionLoading}
                      onChange={() => togglePlaylistEnabled(selectedPl.id)} />
                    <span className="pl-toggle-slider"></span>
                  </label>
                  <button className="pl-detail-edit-btn" onClick={() => openEditModal(selectedPl)}>
                    <i className="fas fa-pen"></i> Edit
                  </button>
                </div>
              </div>

              {/* Schedule Block */}
              {selectedPl.schedule && (
                <div className="pl-detail-schedule">
                  <div className="pl-detail-section-title"><i className="fas fa-calendar"></i> Schedule</div>
                  <div className="pl-detail-schedule-body">
                    <div className="pl-detail-days">
                      {DAYS.map((d) => (
                        <span key={d} className={`pl-detail-day-pill ${selectedPl.schedule!.days.includes(DAYS.indexOf(d)) ? "active" : ""}`}>{d}</span>
                      ))}
                    </div>
                    <div className="pl-detail-time">
                      {selectedPl.schedule.startTime} → {selectedPl.schedule.endTime}
                    </div>
                    <div className="pl-detail-next-run">
                      <i className="fas fa-hourglass-half"></i> Next run: Scheduled daily
                    </div>
                  </div>
                </div>
              )}

              {/* Songs Section */}
              <div className="pl-detail-songs">
                <div className="pl-detail-songs-header">
                  <span className="pl-detail-section-title"><i className="fas fa-music"></i> Songs ({selectedSongs.length})</span>
                  <button className="pl-detail-add-songs-btn" onClick={() => { setAddSongsPlId(selectedPl.id); setAddSongsSearch(""); setAddSongsSelected(new Set()); setShowSongPicker(true); }}>
                    <i className="fas fa-plus"></i> Add Songs
                  </button>
                </div>

                {selectedSongs.length === 0 ? (
                  <div className="pl-detail-empty-songs">
                    <i className="fas fa-music"></i>
                    <p>No songs yet</p>
                    <span>Tap "+ Add Songs" to add music to this playlist</span>
                  </div>
                ) : (
                  <div className="pl-detail-song-list">
                    {selectedSongs.map((song, idx) => (
                      <div className="pl-detail-song-item" key={song.id}>
                        <span className="pl-detail-song-drag"><i className="fas fa-grip-vertical"></i></span>
                        <img className="pl-detail-song-cover" src={song.albumArt || "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=40&h=40&fit=crop"} alt={song.title} />
                        <div className="pl-detail-song-info">
                          <div className="pl-detail-song-title">{song.title}</div>
                          <div className="pl-detail-song-artist">{song.artist || "Unknown Artist"}</div>
                        </div>
                        <span className="pl-detail-song-duration">{song.duration}</span>
                        <button className="pl-detail-song-remove" onClick={() => removeSongFromPlaylist(selectedPl.id, song.id)} title="Remove">
                          <i className="fas fa-xmark"></i>
                        </button>
                      </div>
                    ))}
                    <div className="pl-detail-total-duration">
                      Total duration: {Math.floor(selectedSongs.reduce((acc, s) => acc + (parseInt(s.duration) || 0), 0) / 60)} mins {selectedSongs.reduce((acc, s) => acc + (parseInt(s.duration) || 0), 0) % 60} secs
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        )}

        {/* ========== CREATE / EDIT MODAL ========== */}
        {(showCreatePlaylist || showEditPlModal) && (
          <>
            <div className="media-modal-overlay" onClick={() => { setShowCreatePlaylist(false); setShowEditPlModal(false); setEditingPlId(null); }}></div>
            <div className="media-modal-sheet">
              <div className="media-modal-handle"></div>
              <div className="media-modal-header">
                <h2>{showEditPlModal ? "Edit Playlist" : "Create New Playlist"}</h2>
                <button className="media-modal-close" onClick={() => { setShowCreatePlaylist(false); setShowEditPlModal(false); setEditingPlId(null); }}><i className="fas fa-xmark"></i></button>
              </div>
              <div className="media-modal-body" style={{ padding: "0 20px 20px" }}>
                {/* Name */}
                <div className="pl-form-row" style={{ marginBottom: 14 }}>
                  <label>Playlist Name</label>
                  <input type="text" className="pl-form-input" value={plForm.name} maxLength={100}
                    onChange={(e) => setPlForm({ ...plForm, name: e.target.value })} placeholder="e.g. Morning Devotion" />
                </div>

                {/* Type */}
                <div className="pl-form-row" style={{ marginBottom: 14 }}>
                  <label>Type</label>
                  <div className="pl-type-options">
                    <label className={`pl-type-option ${plCreateType === "standard" ? "active" : ""}`}>
                      <input type="radio" name="plType" checked={plCreateType === "standard"} onChange={() => setPlCreateType("standard")} />
                      <span className="pl-type-option-label">General Rotation</span>
                      <span className="pl-type-option-desc">Always plays as fallback</span>
                    </label>
                    <label className={`pl-type-option ${plCreateType === "scheduled" ? "active" : ""}`}>
                      <input type="radio" name="plType" checked={plCreateType === "scheduled"} onChange={() => setPlCreateType("scheduled")} />
                      <span className="pl-type-option-label">Scheduled</span>
                      <span className="pl-type-option-desc">Plays at set times</span>
                    </label>
                    <label className={`pl-type-option ${plCreateType === "on_demand" ? "active" : ""}`}>
                      <input type="radio" name="plType" checked={plCreateType === "on_demand"} onChange={() => setPlCreateType("on_demand")} />
                      <span className="pl-type-option-label">On Demand</span>
                      <span className="pl-type-option-desc">Triggered manually</span>
                    </label>
                  </div>
                </div>

                {/* Play Order */}
                <div className="pl-form-row" style={{ marginBottom: 14 }}>
                  <label>Play Order</label>
                  <div className="pl-order-options">
                    <label className={`pl-order-option ${plCreateOrder === "shuffle" ? "active" : ""}`}>
                      <input type="radio" name="plOrder" checked={plCreateOrder === "shuffle"} onChange={() => setPlCreateOrder("shuffle")} />
                      <span>Shuffle</span>
                    </label>
                    <label className={`pl-order-option ${plCreateOrder === "sequential" ? "active" : ""}`}>
                      <input type="radio" name="plOrder" checked={plCreateOrder === "sequential"} onChange={() => setPlCreateOrder("sequential")} />
                      <span>Sequential</span>
                    </label>
                  </div>
                </div>

                {/* Weight */}
                <div className="pl-form-row" style={{ marginBottom: 14 }}>
                  <label>Weight ({plForm.weight})</label>
                  <input type="range" min="1" max="20" className="pl-form-range" value={plForm.weight}
                    onChange={(e) => setPlForm({ ...plForm, weight: parseInt(e.target.value) })} />
                </div>

                {/* Schedule (only for scheduled) */}
                {plCreateType === "scheduled" && (
                  <div className="pl-schedule-config" style={{ marginBottom: 14 }}>
                    <label>Schedule</label>
                    <div className="pl-day-chips">
                      {DAYS.map((d) => (
                        <button key={d} className={`pl-day-chip ${plSchedule.days.includes(d) ? "active" : ""}`}
                          onClick={() => toggleScheduleDay(d)}>{d}</button>
                      ))}
                    </div>
                    <div className="pl-time-row" style={{ marginTop: 10 }}>
                      <div>
                        <label>Start Time</label>
                        <input type="time" className="pl-form-input" value={plSchedule.startTime}
                          onChange={(e) => setPlSchedule({ ...plSchedule, startTime: e.target.value })} />
                      </div>
                      <div>
                        <label>End Time</label>
                        <input type="time" className="pl-form-input" value={plSchedule.endTime}
                          onChange={(e) => setPlSchedule({ ...plSchedule, endTime: e.target.value })} />
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="pl-form-actions" style={{ justifyContent: "flex-end", marginTop: 8 }}>
                  {showEditPlModal && (
                    <button className="pl-form-danger" onClick={() => { setPlConfirmDelete(editingPlId); }} disabled={plActionLoading || editingPlId ? playlists.find(p => p.id === editingPlId)?.name === "Default" : false}>
                      <i className="fas fa-trash-can"></i> Delete
                    </button>
                  )}
                  <button className="pl-form-cancel" onClick={() => { setShowCreatePlaylist(false); setShowEditPlModal(false); setEditingPlId(null); }} disabled={plActionLoading}>
                    Cancel
                  </button>
                  <button className="pl-form-save" onClick={showEditPlModal ? saveEditedPlaylist : createPlaylist}
                    disabled={plActionLoading || !plForm.name.trim()}>
                    {plActionLoading ? <i className="fas fa-spinner fa-spin"></i> : null}
                    {plActionLoading ? " Saving..." : showEditPlModal ? "Save Changes" : "Create Playlist"}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ========== CONFIRM DELETE DIALOG ========== */}
        {plConfirmDelete && (
          <>
            <div className="media-modal-overlay" onClick={() => setPlConfirmDelete(null)}></div>
            <div className="media-modal-sheet" style={{ maxWidth: 360 }}>
              <div className="media-modal-handle"></div>
              <div className="media-modal-header">
                <h2>Delete Playlist?</h2>
              </div>
              <div className="media-modal-body" style={{ padding: "0 20px 20px", textAlign: "center" }}>
                <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: "8px 0 16px" }}>
                  This will permanently remove "{playlists.find(p => p.id === plConfirmDelete)?.name}" and remove it from the rotation.
                </p>
                <div className="pl-form-actions" style={{ justifyContent: "center" }}>
                  <button className="pl-form-cancel" onClick={() => setPlConfirmDelete(null)}>Cancel</button>
                  <button className="pl-form-danger" onClick={() => deletePlaylist(plConfirmDelete)} disabled={plActionLoading}>
                    {plActionLoading ? <i className="fas fa-spinner fa-spin"></i> : null}
                    {plActionLoading ? " Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ========== ADD SONGS MODAL ========== */}
        {showSongPicker && (
          <>
            <div className="media-modal-overlay" onClick={() => { setShowSongPicker(false); setAddSongsPlId(null); setAddSongsSearch(""); setAddSongsSelected(new Set()); }}></div>
            <div className="media-modal-sheet">
              <div className="media-modal-handle"></div>
              <div className="media-modal-header">
                <h2>Add Songs to {playlists.find(p => p.id === addSongsPlId)?.name || "Playlist"}</h2>
                <button className="media-modal-close" onClick={() => { setShowSongPicker(false); setAddSongsPlId(null); setAddSongsSearch(""); setAddSongsSelected(new Set()); }}><i className="fas fa-xmark"></i></button>
              </div>
              <div className="pl-picker-toolbar">
                <i className="fas fa-search"></i>
                <input type="text" className="pl-picker-search" placeholder="Search songs..." value={addSongsSearch}
                  onChange={(e) => setAddSongsSearch(e.target.value)} />
              </div>
              <div className="media-modal-body">
                {stationFiles.length === 0 ? (
                  <div style={{ textAlign: "center", padding: 20, color: "#888" }}>
                    <i className="fas fa-music" style={{ fontSize: 28, marginBottom: 8, opacity: 0.4 }}></i>
                    <div>No media files found. Upload music first.</div>
                  </div>
                ) : (
                  stationFiles
                    .filter((s) => !addSongsSearch || s.title.toLowerCase().includes(addSongsSearch.toLowerCase()) || s.artist?.toLowerCase().includes(addSongsSearch.toLowerCase()))
                    .map((song) => {
                      const alreadyInPlaylist = addSongsPlId && song.playlists.includes(addSongsPlId);
                      const isChecked = addSongsSelected.has(song.id);
                      return (
                        <div
                          className={`pl-picker-item ${alreadyInPlaylist ? "disabled" : ""} ${isChecked ? "selected" : ""}`}
                          key={song.id}
                          onClick={() => {
                            if (alreadyInPlaylist) return;
                            const next = new Set(addSongsSelected);
                            if (next.has(song.id)) next.delete(song.id);
                            else next.add(song.id);
                            setAddSongsSelected(next);
                          }}
                        >
                          <div className={`pl-picker-checkbox ${isChecked ? "checked" : ""}`}>
                            {isChecked && <i className="fas fa-check"></i>}
                          </div>
                          <img className="pl-picker-cover" src={song.albumArt || "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=40&h=40&fit=crop"} alt={song.title} />
                          <div className="pl-picker-info">
                            <div className="pl-picker-title">{song.title}</div>
                            <div className="pl-picker-artist">{song.artist || "Unknown"} · {song.duration}</div>
                          </div>
                          {alreadyInPlaylist && <span className="pl-picker-already">In playlist</span>}
                        </div>
                      );
                    })
                )}
              </div>
              <div className="pl-picker-footer">
                <span className="pl-picker-count">{addSongsSelected.size} song{addSongsSelected.size !== 1 ? "s" : ""} selected</span>
                <div className="pl-form-actions">
                  <button className="pl-form-cancel" onClick={() => { setShowSongPicker(false); setAddSongsPlId(null); setAddSongsSearch(""); setAddSongsSelected(new Set()); }}>Cancel</button>
                  <button className="pl-form-save" onClick={addSongsToPlaylist} disabled={addSongsSelected.size === 0 || plActionLoading}>
                    {plActionLoading ? <i className="fas fa-spinner fa-spin"></i> : null}
                    {plActionLoading ? " Adding..." : "Add to Playlist"}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  // ========== DJ ACCOUNTS SECTION ==========
  const renderDJAccounts = () => {
    const addDJ = async () => {
      if (djActionLoading) return;
      setDjActionLoading(true);
      try {
        const newDJ = await apiCreateStreamer({
          displayName: djForm.displayName || "New DJ",
          username: djForm.username || "new_dj",
          password: djForm.password || "changeme",
        });
        setDjList([...djList, newDJ]);
        setShowAddDJ(false);
        setDjForm({ displayName: "", username: "", password: "" });
        window.dispatchEvent(new CustomEvent("show-toast", { detail: { title: "DJ Added", message: `"${newDJ.displayName}" has been added`, type: "success", duration: 2500 } }));
      } catch {
        window.dispatchEvent(new CustomEvent("show-toast", { detail: { title: "Error", message: "Failed to create DJ account", type: "error", duration: 3000 } }));
      }
      setDjActionLoading(false);
    };

    const deleteDJ = async (id: string) => {
      if (djActionLoading) return;
      setDjActionLoading(true);
      await apiDeleteStreamer(id).catch(() => {});
      setDjList(djList.filter((d) => d.id !== id));
      window.dispatchEvent(new CustomEvent("show-toast", { detail: { title: "DJ Removed", message: "Account deleted", type: "info", duration: 2500 } }));
      setDjActionLoading(false);
    };

    const saveEditDJ = async () => {
      if (!editingDJ || djActionLoading) return;
      setDjActionLoading(true);
      try {
        const updated = await apiUpdateStreamer(editingDJ, { displayName: djForm.displayName, username: djForm.username });
        setDjList(djList.map((d) => d.id === editingDJ ? { ...d, displayName: updated.displayName, username: updated.username } : d));
        setEditingDJ(null);
        setDjForm({ displayName: "", username: "", password: "" });
        window.dispatchEvent(new CustomEvent("show-toast", { detail: { title: "DJ Updated", message: "Credentials saved", type: "success", duration: 2500 } }));
      } catch {
        window.dispatchEvent(new CustomEvent("show-toast", { detail: { title: "Error", message: "Failed to update DJ account", type: "error", duration: 3000 } }));
      }
      setDjActionLoading(false);
    };

    return (
      <div className="dj-content">
        <div className="dj-toolbar">
          <button className="pl-create-btn" onClick={() => setShowAddDJ(true)}>
            <i className="fas fa-plus"></i> Add DJ
          </button>
        </div>

        {showAddDJ && (
          <div className="dj-form">
            <h4>New DJ Account</h4>
            <div className="pl-form-row">
              <label>Display Name</label>
              <input type="text" className="pl-form-input" value={djForm.displayName}
                onChange={(e) => setDjForm({ ...djForm, displayName: e.target.value })} placeholder="e.g. Pastor John" />
            </div>
            <div className="pl-form-row">
              <label>Username</label>
              <input type="text" className="pl-form-input" value={djForm.username}
                onChange={(e) => setDjForm({ ...djForm, username: e.target.value })} placeholder="e.g. pastor_john" />
            </div>
            <div className="pl-form-row">
              <label>Password</label>
              <input type="password" className="pl-form-input" value={djForm.password}
                onChange={(e) => setDjForm({ ...djForm, password: e.target.value })} placeholder="Enter a secure password" />
            </div>
            <div className="pl-form-actions">
              <button className="pl-form-save" onClick={addDJ} disabled={djActionLoading}>
                {djActionLoading ? <i className="fas fa-spinner fa-spin"></i> : null}
                {djActionLoading ? " Adding..." : "Add DJ"}
              </button>
              <button className="pl-form-cancel" onClick={() => setShowAddDJ(false)} disabled={djActionLoading}>Cancel</button>
            </div>
          </div>
        )}

        <div className="pl-count">{djList.length} DJ{djList.length !== 1 ? "s" : ""}</div>

        <div className="dj-list">
          {djList.map((dj) => {
            const isEditing = editingDJ === dj.id;
            const isExpanded = expandedDJ === dj.id;
            return (
              <div className={`dj-card ${isExpanded ? "expanded" : ""}`} key={dj.id}>
                <div className="dj-card-header" onClick={() => setExpandedDJ(isExpanded ? null : dj.id)}>
                  <div className="dj-avatar" style={{ background: `hsl(${dj.displayName.length * 30}, 40%, 45%)`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 18 }}>{dj.displayName.charAt(0).toUpperCase()}</div>
                  <div className="dj-card-info">
                    <div className="dj-card-name">
                      {dj.displayName}
                      {dj.isLive && <span className="dj-live-badge"><span className="dj-live-dot"></span> Live</span>}
                    </div>
                    <div className="dj-card-username">@{dj.username} · Last: {dj.lastBroadcast || "Never"}</div>
                  </div>
                  <div className="dj-card-actions">
                    <button className="dj-action-btn" onClick={(e) => { e.stopPropagation(); setEditingDJ(dj.id); setDjForm({ displayName: dj.displayName, username: dj.username, password: "" }); }}>
                      <i className="fas fa-pen"></i>
                    </button>
                    <button className="dj-action-btn danger" onClick={(e) => { e.stopPropagation(); deleteDJ(dj.id); }} disabled={djActionLoading}>
                      {djActionLoading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-trash-can"></i>}
                    </button>
                    <i className={`fas fa-chevron-down pl-chevron ${isExpanded ? "open" : ""}`}></i>
                  </div>
                </div>

                {isEditing && (
                  <div className="dj-edit-form">
                    <div className="pl-form-row">
                      <label>Display Name</label>
                      <input type="text" className="pl-form-input" value={djForm.displayName}
                        onChange={(e) => setDjForm({ ...djForm, displayName: e.target.value })} />
                    </div>
                    <div className="pl-form-row">
                      <label>Username</label>
                      <input type="text" className="pl-form-input" value={djForm.username}
                        onChange={(e) => setDjForm({ ...djForm, username: e.target.value })} />
                    </div>
                    <div className="pl-form-row">
                      <label>New Password</label>
                      <input type="password" className="pl-form-input" value={djForm.password}
                        onChange={(e) => setDjForm({ ...djForm, password: e.target.value })} placeholder="Leave blank to keep current" />
                    </div>
                    <div className="pl-form-actions">
                      <button className="pl-form-save" onClick={saveEditDJ} disabled={djActionLoading}>
                        {djActionLoading ? <i className="fas fa-spinner fa-spin"></i> : null}
                        {djActionLoading ? " Saving..." : "Save"}
                      </button>
                      <button className="pl-form-cancel" onClick={() => setEditingDJ(null)} disabled={djActionLoading}>Cancel</button>
                    </div>
                  </div>
                )}

                {isExpanded && dj.broadcastHistory && dj.broadcastHistory.length > 0 && (
                  <div className="dj-history">
                    <div className="dj-history-title">Broadcast History</div>
                    {dj.broadcastHistory.map((h, i) => (
                      <div className="dj-history-item" key={i}>
                        <span className="dj-history-date">{h.date}</span>
                        <span className="dj-history-time">{h.startTime}</span>
                        <span className="dj-history-duration">{h.duration}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ========== SCHEDULE SECTION ==========
  const renderSchedule = () => {
    const today = new Date().getDay();
    const currentHour = new Date().getHours();
    const currentMin = new Date().getMinutes();

    const playlistColors = ["#E8A838","#8B5CF6","#3B82F6","#22C55E","#EF4444","#F59E0B","#EC4899","#14B8A6"];
    const getColor = (pid: string) => playlistColors[parseInt(pid) % playlistColors.length];

    type SchedBlock = { id: string; day: number; startHour: number; endHour: number; name: string; color: string; playlistId: string };
    const scheduleBlocks: SchedBlock[] = [];
    for (const pl of playlists) {
      if (pl.schedule && pl.schedule.days.length > 0) {
        const startH = parseInt(pl.schedule.startTime);
        const endH = parseInt(pl.schedule.endTime);
        for (const day of pl.schedule.days) {
          scheduleBlocks.push({
            id: pl.id + "_" + day,
            day,
            startHour: startH,
            endHour: endH,
            name: pl.name,
            color: getColor(pl.id),
            playlistId: pl.id,
          });
        }
      }
    }

    const handleSlotClick = (day: number, hour: number) => {
      const existing = scheduleBlocks.find((b) => b.day === day && b.startHour <= hour && b.endHour > hour);
      if (existing) {
        setEditingBlock(existing);
        setShowScheduleModal(true);
      } else {
        setSchedForm({ playlistId: "", days: [String(day)], startTime: `${hour}:00`, endTime: `${Math.min(hour + 2, 23)}:00` });
        setShowAddSchedule(true);
      }
    };

    const deleteBlock = async () => {
      if (editingBlock) {
        await apiUpdatePlaylist(editingBlock.playlistId, { schedule: { days: [], startTime: "09:00", endTime: "17:00" } }).catch(() => {});
        setPlaylists((prev) =>
          prev.map((p) => p.id === editingBlock.playlistId ? { ...p, schedule: undefined } : p)
        );
        setShowScheduleModal(false);
        setEditingBlock(null);
        window.dispatchEvent(new CustomEvent("show-toast", { detail: { title: "Schedule Removed", message: `"${editingBlock.name}" schedule deleted`, type: "info", duration: 2500 } }));
      }
    };

    const handleAddSchedule = async () => {
      const pl = playlists.find((p) => p.id === schedForm.playlistId);
      if (!pl) return;
      const dayNums = schedForm.days.map(Number);
      await apiUpdatePlaylist(pl.id, {
        type: "scheduled",
        schedule: { days: dayNums, startTime: schedForm.startTime, endTime: schedForm.endTime },
      }).catch(() => {});
      setPlaylists((prev) =>
        prev.map((p) => p.id === pl.id ? { ...p, type: "scheduled", schedule: { days: dayNums, startTime: schedForm.startTime, endTime: schedForm.endTime } } : p)
      );
      setShowAddSchedule(false);
      setSchedForm({ playlistId: "", days: [], startTime: "09:00", endTime: "17:00" });
      window.dispatchEvent(new CustomEvent("show-toast", { detail: { title: "Schedule Added", message: `"${pl.name}" scheduled`, type: "success", duration: 2500 } }));
    };

    const nonScheduled = playlists.filter((p) => p.type !== "scheduled" || !p.schedule?.days?.length);

    return (
      <div className="sched-content">
        <div className="sched-header-info">
          <h3>Weekly Schedule</h3>
          <span className="section-block-count">{scheduleBlocks.length} scheduled blocks</span>
        </div>

        {/* Add Schedule Button */}
        <div className="dj-toolbar" style={{ margin: "0 0 12px" }}>
          <button className="pl-create-btn" onClick={() => setShowAddSchedule(true)} disabled={nonScheduled.length === 0}>
            <i className="fas fa-plus"></i> Add Schedule
          </button>
        </div>

        {/* Add Schedule Form */}
        {showAddSchedule && (
          <div className="dj-form">
            <h4>Add Schedule Block</h4>
            <div className="pl-form-row">
              <label>Playlist</label>
              <select className="pl-form-input" value={schedForm.playlistId}
                onChange={(e) => setSchedForm({ ...schedForm, playlistId: e.target.value })}>
                <option value="">Select a playlist...</option>
                {nonScheduled.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="pl-form-row">
              <label>Days of Week</label>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {DAYS.map((d, i) => (
                  <label key={d} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--text-secondary)", cursor: "pointer" }}>
                    <input type="checkbox" checked={schedForm.days.includes(String(i))}
                      onChange={() => setSchedForm({ ...schedForm, days: schedForm.days.includes(String(i)) ? schedForm.days.filter((x) => x !== String(i)) : [...schedForm.days, String(i)] })} />
                    {d}
                  </label>
                ))}
              </div>
            </div>
            <div className="pl-form-row" style={{ flexDirection: "row", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <label>Start Time</label>
                <input type="time" className="pl-form-input" value={schedForm.startTime}
                  onChange={(e) => setSchedForm({ ...schedForm, startTime: e.target.value })} />
              </div>
              <div style={{ flex: 1 }}>
                <label>End Time</label>
                <input type="time" className="pl-form-input" value={schedForm.endTime}
                  onChange={(e) => setSchedForm({ ...schedForm, endTime: e.target.value })} />
              </div>
            </div>
            <div className="pl-form-actions">
              <button className="pl-form-save" onClick={handleAddSchedule} disabled={!schedForm.playlistId}>Save</button>
              <button className="pl-form-cancel" onClick={() => setShowAddSchedule(false)}>Cancel</button>
            </div>
          </div>
        )}

        <div className="sched-grid-wrapper">
          {/* Days header */}
          <div className="sched-grid">
            <div className="sched-time-header">Time</div>
            {DAYS.map((day, i) => (
              <div className={`sched-day-header ${i === today ? "today" : ""}`} key={day}>
                {day}
              </div>
            ))}

            {HOURS.map((hour) => (
              <React.Fragment key={hour}>
                <div className="sched-time-cell">
                  {hour === 0 ? "12am" : hour < 12 ? `${hour}am` : hour === 12 ? "12pm" : `${hour - 12}pm`}
                </div>
                {DAYS.map((day, dayIdx) => {
                  const block = scheduleBlocks.find(
                    (b) => b.day === dayIdx && b.startHour <= hour && b.endHour > hour
                  );
                  const isCurrentTime = dayIdx === today && hour === currentHour;

                  return (
                    <div
                      className={`sched-cell ${dayIdx === today ? "today" : ""} ${block ? "has-block" : ""}`}
                      key={`${day}-${hour}`}
                      onClick={() => handleSlotClick(dayIdx, hour)}
                    >
                      {block ? (
                        <div className="sched-block" style={{ background: block.color }}>
                          {block.name}
                        </div>
                      ) : (
                        <div className="sched-empty-slot"></div>
                      )}
                      {isCurrentTime && currentMin >= 0 && !block && (
                        <div className="sched-now-line"></div>
                      )}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="sched-legend">
          {scheduleBlocks.slice(0, 10).map((b) => (
            <div className="sched-legend-item" key={b.id}>
              <span className="sched-legend-dot" style={{ background: b.color }}></span>
              <span className="sched-legend-name">{b.name}</span>
            </div>
          ))}
        </div>

        {showScheduleModal && editingBlock && (
          <>
            <div className="media-modal-overlay" onClick={() => { setShowScheduleModal(false); setEditingBlock(null); }}></div>
            <div className="media-modal-sheet">
              <div className="media-modal-handle"></div>
              <div className="media-modal-header">
                <h2>{editingBlock.name}</h2>
                <p>{DAYS[editingBlock.day]} · {editingBlock.startHour}:00 — {editingBlock.endHour}:00</p>
              </div>
              <div className="media-modal-body">
                <div className="sched-modal-actions">
                  <button className="pl-form-save" onClick={() => { setShowScheduleModal(false); setEditingBlock(null); }}>
                    <i className="fas fa-pen"></i> Edit Block
                  </button>
                  <button className="sched-delete-btn" onClick={deleteBlock}>
                    <i className="fas fa-trash-can"></i> Remove Block
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  // ========== ANALYTICS SECTION ==========
  const renderAnalytics = () => {
    const chartData = listenerHistory.length > 0 ? listenerHistory
      : [{ time: "No data", count: 0 }];
    const maxChart = Math.max(...chartData.map((d) => d.count), 1);

    return (
      <div className="an-content">
        {/* Stat Cards */}
        <div className="an-stats-row">
          <div className="an-stat-card">
            <div className="an-stat-value">{currentListeners.toLocaleString()}</div>
            <div className="an-stat-label">Current Listeners</div>
          </div>
          <div className="an-stat-card">
            <div className="an-stat-value">{peakListeners.toLocaleString()}</div>
            <div className="an-stat-label">Peak (Session)</div>
          </div>
        </div>

        {/* Line Chart */}
        <div className="section-block">
          <div className="section-block-header">
            <h3>Listeners Over Time</h3>
          </div>
          <div className="an-chart">
            <div className="an-chart-bars">
              {chartData.map((d, i) => (
                <div className="an-chart-col" key={i} title={`${d.time}: ${d.count}`}>
                  <div className="an-chart-bar" style={{ height: `${(d.count / maxChart) * 100}%` }}></div>
                </div>
              ))}
            </div>
            <div className="an-chart-labels">
              {chartData.map((d, i) => (
                <span className="an-chart-label" key={i}>{chartData.length <= 8 ? d.time : i % Math.ceil(chartData.length / 8) === 0 ? d.time : ""}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Top 10 Songs */}
        <div className="section-block">
          <div className="section-block-header">
            <h3>Top Songs</h3>
          </div>
          <div className="an-top-songs">
            {topSongs.length === 0 ? (
              <div style={{ textAlign: "center", padding: 20, color: "var(--text-tertiary)", fontSize: 13 }}>
                No song history yet
              </div>
            ) : (
              topSongs.map((song, i) => {
                const pct = (song.plays / topSongs[0].plays) * 100;
                return (
                  <div className="an-top-song" key={i}>
                    <span className="an-top-rank">{i + 1}</span>
                    <div className="an-top-info">
                      <div className="an-top-title">{song.title}</div>
                      <div className="an-top-artist">{song.artist}</div>
                    </div>
                    <div className="an-top-bar-wrapper">
                      <div className="an-top-bar" style={{ width: `${pct}%` }}></div>
                    </div>
                    <span className="an-top-plays">{song.plays}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Broadcast History */}
        <div className="section-block">
          <div className="section-block-header">
            <h3>Broadcast History</h3>
          </div>
          <div className="history-list">
            {broadcastHistory.length === 0 ? (
              <div style={{ textAlign: "center", padding: 20, color: "var(--text-tertiary)", fontSize: 13 }}>
                No broadcast history yet
              </div>
            ) : (
              broadcastHistory.map((h, i) => (
                <div className="history-item" key={i}>
                  <div className="history-info">
                    <div className="history-title">{h.dj}</div>
                    <div className="history-artist">{h.date} · {h.duration}</div>
                  </div>
                  <span className="history-time">{h.listeners > 0 ? `${h.listeners} listeners` : ""}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  // ========== WEBHOOKS SECTION ==========
  const renderWebhooks = () => {
    const toggleWebhook = async (id: string) => {
      try {
        const updated = await apiToggleWebhook(id);
        setWebhooks(webhooks.map((w) => w.id === id ? updated : w));
      } catch {
        window.dispatchEvent(new CustomEvent("show-toast", { detail: { title: "Error", message: "Failed to toggle webhook", type: "error", duration: 2500 } }));
      }
    };

    const deleteWebhook = async (id: string) => {
      if (whActionLoading) return;
      setWhActionLoading(true);
      await apiDeleteWebhook(id).catch(() => {});
      setWebhooks(webhooks.filter((w) => w.id !== id));
      window.dispatchEvent(new CustomEvent("show-toast", { detail: { title: "Webhook Deleted", message: "Webhook removed", type: "info", duration: 2500 } }));
      setWhActionLoading(false);
    };

    const addWebhook = async () => {
      if (!whForm.url || whActionLoading) return;
      setWhActionLoading(true);
      try {
        const newWh = await apiCreateWebhook({
          url: whForm.url,
          events: whForm.events,
          name: "Webhook " + new Date().toLocaleDateString(),
        });
        setWebhooks([...webhooks, newWh]);
        setShowAddWebhook(false);
        setWhForm({ url: "", secretKey: "", events: [] });
        window.dispatchEvent(new CustomEvent("show-toast", { detail: { title: "Webhook Added", message: "New endpoint configured", type: "success", duration: 2500 } }));
      } catch {
        window.dispatchEvent(new CustomEvent("show-toast", { detail: { title: "Error", message: "Failed to create webhook", type: "error", duration: 2500 } }));
      }
      setWhActionLoading(false);
    };

    const toggleWhEvent = (eventId: string) => {
      setWhForm((prev) => ({
        ...prev,
        events: prev.events.includes(eventId)
          ? prev.events.filter((e) => e !== eventId)
          : [...prev.events, eventId],
      }));
    };

    const testWebhookHandler = async (id: string) => {
      const result = await apiTestWebhook(id).catch(() => ({ success: false }));
      if (result.success) {
        window.dispatchEvent(new CustomEvent("show-toast", { detail: { title: "Test Sent", message: "A test ping has been sent to the webhook URL", type: "success", duration: 3000 } }));
      } else {
        window.dispatchEvent(new CustomEvent("show-toast", { detail: { title: "Test Failed", message: "Could not send test ping", type: "error", duration: 3000 } }));
      }
    };

    return (
      <div className="wh-content">
        <div className="pl-toolbar">
          <button className="pl-create-btn" onClick={() => setShowAddWebhook(true)}>
            <i className="fas fa-plus"></i> Add Webhook
          </button>
        </div>

        {showAddWebhook && (
          <div className="wh-form">
            <h4>New Webhook</h4>
            <div className="pl-form-row">
              <label>Endpoint URL</label>
              <input type="url" className="pl-form-input" value={whForm.url}
                onChange={(e) => setWhForm({ ...whForm, url: e.target.value })} placeholder="https://hooks.example.com/events" />
            </div>
            <div className="pl-form-row">
              <label>Secret Key (optional)</label>
              <input type="text" className="pl-form-input" value={whForm.secretKey}
                onChange={(e) => setWhForm({ ...whForm, secretKey: e.target.value })} placeholder="Leave empty for no secret" />
            </div>
            <div className="pl-form-row">
              <label>Events to trigger on</label>
              <div className="wh-events-grid">
                {AVAILABLE_EVENTS.map((ev) => (
                  <label className="wh-event-chip" key={ev.id}>
                    <input type="checkbox" checked={whForm.events.includes(ev.id)}
                      onChange={() => toggleWhEvent(ev.id)} />
                    <span className={`wh-event-label ${whForm.events.includes(ev.id) ? "checked" : ""}`}>{ev.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="pl-form-actions">
              <button className="pl-form-save" onClick={addWebhook} disabled={whActionLoading}>
                {whActionLoading ? <i className="fas fa-spinner fa-spin"></i> : null}
                {whActionLoading ? " Adding..." : "Add Webhook"}
              </button>
              <button className="pl-form-cancel" onClick={() => setShowAddWebhook(false)} disabled={whActionLoading}>Cancel</button>
            </div>
          </div>
        )}

        <div className="pl-count">{webhooks.length} webhook{webhooks.length !== 1 ? "s" : ""}</div>

        <div className="wh-list">
          {webhooks.map((wh) => (
            <div className={`wh-card ${wh.enabled ? "" : "disabled"}`} key={wh.id}>
              <div className="wh-card-top">
                <div className="wh-card-url">{wh.url}</div>
                <label className="pl-toggle">
                  <input type="checkbox" checked={wh.enabled} disabled={whActionLoading} onChange={() => toggleWebhook(wh.id)} />
                  <span className="pl-toggle-slider"></span>
                </label>
              </div>
              <div className="wh-card-events">
                {wh.events.map((evId) => {
                  const ev = AVAILABLE_EVENTS.find((e) => e.id === evId);
                  return ev ? <span className="wh-event-tag" key={evId}>{ev.label}</span> : null;
                })}
              </div>
              <div className="wh-card-actions">
                <button className="wh-test-btn" onClick={() => testWebhookHandler(wh.id)} disabled={whActionLoading}>
                  {whActionLoading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-paper-plane"></i>} Test
                </button>
                <button className="wh-delete-btn" onClick={() => deleteWebhook(wh.id)} disabled={whActionLoading}>
                  {whActionLoading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-trash-can"></i>} Delete
                </button>
              </div>
              {wh.secret && (
                <div className="wh-secret-badge">
                  <i className="fas fa-lock"></i> Signed with secret key
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ========== SETTINGS SECTION ==========
  const renderSettings = () => {
    const copyToClipboard = (text: string, field: string) => {
      navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
      window.dispatchEvent(new CustomEvent("show-toast", { detail: { title: "Copied", message: "Copied to clipboard", type: "success", duration: 1500 } }));
    };

    if (settingsLoading) {
      return (
        <div className="st-content">
          <div className="st-loading">Loading settings...</div>
        </div>
      );
    }

    return (
      <div className="st-content">
        {settingsError && (
          <div className="st-error-banner">
            <i className="fas fa-circle-exclamation"></i> {settingsError}
          </div>
        )}
        {settingsSuccess && (
          <div className="st-success-banner">
            <i className="fas fa-check-circle"></i> Settings saved successfully
          </div>
        )}

        {/* Station Name */}
        <div className="st-section">
          <div className="st-section-title">Station Name</div>
          <input type="text" className="gl-input" value={settings.stationName}
            onChange={(e) => setSettings({ ...settings, stationName: e.target.value })} />
        </div>

        {/* URLs */}
        <div className="st-section">
          <div className="st-section-title">Stream URL</div>
          <div className="st-copy-row">
            <input type="text" className="gl-input st-copy-input" value={settings.streamUrl} readOnly />
            <button className="st-copy-btn" onClick={() => copyToClipboard(settings.streamUrl, "stream")}>
              <i className={`fas ${copiedField === "stream" ? "fa-check" : "fa-copy"}`}></i>
            </button>
          </div>
        </div>

        <div className="st-section">
          <div className="st-section-title">Public Page URL</div>
          <div className="st-copy-row">
            <input type="text" className="gl-input st-copy-input" value={settings.publicPageUrl} readOnly />
            <button className="st-copy-btn" onClick={() => copyToClipboard(settings.publicPageUrl, "public")}>
              <i className={`fas ${copiedField === "public" ? "fa-check" : "fa-copy"}`}></i>
            </button>
          </div>
        </div>

        {/* Toggles */}
        <div className="st-toggle-row">
          <div className="st-toggle-info">
            <div className="st-toggle-title">AutoDJ</div>
            <div className="st-toggle-desc">AutoDJ fills gaps when no DJ is broadcasting</div>
          </div>
          <label className="pl-toggle">
            <input type="checkbox" checked={settings.autoDJEnabled}
              onChange={() => {
                const newVal = !settings.autoDJEnabled;
                setSettings({ ...settings, autoDJEnabled: newVal });
                toggleAutoDJ().catch(() => setSettings({ ...settings, autoDJEnabled: !newVal }));
              }} />
            <span className="pl-toggle-slider"></span>
          </label>
        </div>

        <div className="st-toggle-row">
          <div className="st-toggle-info">
            <div className="st-toggle-title">Public Page Visibility</div>
            <div className="st-toggle-desc">Allow the station page to appear in search results</div>
          </div>
          <label className="pl-toggle">
            <input type="checkbox" checked={settings.publicPageVisible}
              onChange={() => setSettings({ ...settings, publicPageVisible: !settings.publicPageVisible })} />
            <span className="pl-toggle-slider"></span>
          </label>
        </div>

        {/* Max Listeners */}
        <div className="st-section">
          <div className="st-section-title">Max Listeners</div>
          <input type="number" className="gl-input" value={settings.maxListeners}
            onChange={(e) => setSettings({ ...settings, maxListeners: parseInt(e.target.value) || 0 })} />
        </div>

        {/* Default Bitrate */}
        <div className="st-section">
          <div className="st-section-title">Default Stream Bitrate</div>
          <div className="gl-quality-options">
            {["64", "128", "192", "320"].map((q) => (
              <button key={q} className={`gl-quality-btn ${settings.defaultBitrate === q ? "active" : ""}`}
                onClick={() => setSettings({ ...settings, defaultBitrate: q })}>{q} kbps</button>
            ))}
          </div>
        </div>

        {/* Mount Points */}
        <div className="st-section">
          <div className="st-section-title">Mount Points</div>
          <div className="st-mount-list">
            {settings.mountPoints.length === 0 ? (
              <div className="st-mount-empty">No mount points found</div>
            ) : (
              settings.mountPoints.map((mp, i) => (
                <div className="st-mount-item" key={i}>
                  <div className="st-mount-info">
                    <span className="st-mount-path">{mp.mount}</span>
                    <span className={`st-mount-type ${mp.type}`}>{mp.type}</span>
                  </div>
                  <span className="st-mount-listeners">{mp.listeners} listeners</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Save Button */}
        <button className="st-save-btn" onClick={saveSettings} disabled={settingsSaving}>
          <i className={`fas ${settingsSaving ? "fa-spinner fa-spin" : "fa-floppy-disk"}`}></i>
          {settingsSaving ? " Saving..." : " Save Settings"}
        </button>

        {/* Danger Zone */}
        <div className="st-danger">
          <div className="st-danger-title">Danger Zone</div>
          <p>Resetting or deleting the station is permanent and cannot be undone.</p>
          <button className="st-danger-btn">
            <i className="fas fa-triangle-exclamation"></i> Reset Station
          </button>
        </div>
      </div>
    );
  };

  // ========== PLAY CONTROL SECTION ==========
  const renderContent = () => {
    switch (activeTab) {
      case "overview": return renderOverview();
      case "go-live": return renderGoLive();
      case "media": return renderMedia();
      case "playlists": return renderPlaylists();
      case "djs": return renderDJAccounts();
      case "schedule": return renderSchedule();
      case "analytics": return renderAnalytics();
      case "webhooks": return renderWebhooks();

      case "settings": return renderSettings();
      default: return renderOverview();
    }
  };

  return (
    <>
      <style>{`
        :root {
          --primary: #E8A838;
          --primary-light: #F5C76B;
          --primary-dark: #C48A2A;
          --bg: #0F0F0F;
          --surface: #1A1A1A;
          --surface-elevated: #242424;
          --surface-card: #1E1E1E;
          --surface-hover: #2A2A2A;
          --text-primary: #FFFFFF;
          --text-secondary: #A0A0A0;
          --text-tertiary: #6B6B6B;
          --border: #2A2A2A;
          --error: #FF6B6B;
          --success: #4ADE80;
          --info: #38BDF8;
          --warning: #FBBF24;
          --overlay: rgba(0,0,0,0.92);
          --gradient-start: #E8A838;
          --gradient-end: #D4762A;
          --gradient-purple: #8B5CF6;
          --gradient-blue: #3B82F6;
          --gradient-red: #EF4444;
          --gradient-green: #22C55E;
          --shadow-soft: 0 4px 20px rgba(232,168,56,0.15);
          --shadow-elevated: 0 8px 32px rgba(0,0,0,0.5);
          --radius-sm: 10px;
          --radius-md: 14px;
          --radius-lg: 18px;
          --radius-xl: 22px;
          --radius-full: 50%;
        }

        * { margin: 0; padding: 0; box-sizing: border-box; -webkit-tap-highlight-color: transparent; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }
        html, body { height: 100%; overflow: hidden; background: var(--bg); color: var(--text-primary); }

        .app-container {
          height: 100%; display: flex; flex-direction: column; position: relative; overflow: hidden;
        }
        @media (min-width: 480px) {
          .app-container { max-width: 480px; margin: 0 auto; border-left: 1px solid var(--border); border-right: 1px solid var(--border); }
        }

        .status-bar { height: env(safe-area-inset-top, 24px); min-height: 24px; background: var(--bg); flex-shrink: 0; }

        /* ========== HEADER ========== */
        .radio-header {
          padding: 12px 16px 10px;
          display: flex; align-items: center; gap: 12px;
          flex-shrink: 0; background: var(--bg); border-bottom: 1px solid var(--border);
        }
        .radio-header-logo {
          width: 40px; height: 40px;
          background: linear-gradient(135deg, var(--gradient-start), var(--gradient-end));
          border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; box-shadow: var(--shadow-soft);
        }
        .radio-header-logo i { font-size: 18px; color: #fff; }
        .radio-header-info { flex: 1; min-width: 0; }
        .radio-header-name { font-size: 15px; font-weight: 700; line-height: 1.2; }
        .radio-header-sub { font-size: 11px; color: var(--text-tertiary); margin-top: 1px; }
        .radio-header-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }

        .on-air-badge {
          display: flex; align-items: center; gap: 6px;
          padding: 4px 12px; border-radius: 20px;
          font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;
        }
        .on-air-badge.live { background: rgba(239,68,68,0.12); color: var(--error); }
        .on-air-badge.off { background: var(--surface-elevated); color: var(--text-tertiary); }
        .on-air-dot {
          width: 7px; height: 7px; border-radius: var(--radius-full);
        }
        .on-air-dot.live { background: var(--error); animation: livePulse 1.5s ease-in-out infinite; }
        .on-air-dot.off { background: var(--text-tertiary); }

        .listener-count {
          display: flex; align-items: center; gap: 5px;
          font-size: 12px; color: var(--text-secondary); font-weight: 600;
        }
        .listener-count i { font-size: 11px; color: var(--text-tertiary); }

        /* ========== NOW PLAYING BAR ========== */
        .now-playing-bar {
          display: flex; align-items: center; gap: 10px;
          padding: 8px 16px; background: var(--surface);
          border-bottom: 1px solid var(--border); flex-shrink: 0;
        }
        .npb-thumb {
          width: 36px; height: 36px; border-radius: 6px; overflow: hidden; flex-shrink: 0;
        }
        .npb-thumb img { width: 100%; height: 100%; object-fit: cover; }
        .npb-info { flex: 1; min-width: 0; }
        .npb-title { font-size: 13px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .npb-artist { font-size: 11px; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .npb-player-btn {
          width: 34px; height: 34px; border-radius: var(--radius-full);
          background: linear-gradient(135deg, var(--gradient-start), var(--gradient-end));
          border: none; color: #fff; font-size: 13px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all 0.2s ease; flex-shrink: 0;
          box-shadow: var(--shadow-soft);
        }
        .npb-player-btn:active { transform: scale(0.9); }

        @keyframes livePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.5); }
        }

        /* ========== TAB BAR ========== */
        .tab-bar {
          display: flex; gap: 2px;
          padding: 8px 12px; overflow-x: auto;
          -webkit-overflow-scrolling: touch; flex-shrink: 0;
          background: var(--bg); border-bottom: 1px solid var(--border);
        }
        .tab-bar::-webkit-scrollbar { display: none; }
        .tab-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 8px 14px; border-radius: 10px;
          border: none; background: transparent;
          color: var(--text-tertiary); font-size: 12px; font-weight: 600;
          cursor: pointer; transition: all 0.2s ease;
          white-space: nowrap; flex-shrink: 0;
        }
        .tab-btn i { font-size: 14px; }
        .tab-btn:active { transform: scale(0.95); }
        .tab-btn.active {
          background: var(--surface-elevated); color: var(--primary);
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }

        /* ========== SCROLLABLE CONTENT ========== */
        .content-scroll {
          flex: 1; overflow-y: auto; overflow-x: hidden;
          -webkit-overflow-scrolling: touch; padding-bottom: 100px;
        }
        .content-scroll::-webkit-scrollbar { display: none; }

        /* ========== OVERVIEW SECTION ========== */
        .overview-content { padding: 16px; display: flex; flex-direction: column; gap: 16px; }

        /* Status Cards Row */
        .overview-cards-row { display: flex; gap: 12px; }
        .status-card {
          flex: 1; background: var(--surface-card); border: 1px solid var(--border);
          border-radius: var(--radius-lg); padding: 16px;
          display: flex; flex-direction: column; gap: 12px;
        }
        .status-card-header {
          display: flex; align-items: center; justify-content: space-between;
        }
        .status-card-label { font-size: 12px; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; }
        .status-badge {
          display: flex; align-items: center; gap: 5px;
          padding: 3px 10px; border-radius: 20px;
          font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;
        }
        .status-badge.live { background: rgba(34,197,94,0.12); color: var(--success); }
        .status-badge.offline { background: var(--surface-elevated); color: var(--text-tertiary); }
        .status-dot {
          width: 6px; height: 6px; border-radius: var(--radius-full);
          background: var(--success);
        }
        .status-dot.pulse { animation: livePulse 1.5s ease-in-out infinite; }

        .status-card-body { display: flex; flex-direction: column; gap: 10px; }
        .status-card-info { display: flex; flex-direction: column; }
        .status-card-stat { font-size: 28px; font-weight: 800; line-height: 1; letter-spacing: -0.5px; }
        .status-card-stat-label { font-size: 12px; color: var(--text-tertiary); font-weight: 500; margin-top: 2px; }

        .broadcast-ctrl-btn {
          width: 100%; padding: 10px; border-radius: var(--radius-sm);
          font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.2s ease;
          display: flex; align-items: center; justify-content: center; gap: 6px; border: none;
        }
        .broadcast-ctrl-btn:active { transform: scale(0.97); }
        .broadcast-ctrl-btn.stop {
          background: rgba(239,68,68,0.12); color: var(--error);
        }
        .broadcast-ctrl-btn.start {
          background: linear-gradient(135deg, var(--gradient-start), var(--gradient-end));
          color: #fff; box-shadow: var(--shadow-soft);
        }

        /* Now Playing Card */
        .now-playing-card {
          background: linear-gradient(135deg, rgba(232,168,56,0.08) 0%, rgba(139,92,246,0.04) 100%);
          border: 1px solid rgba(232,168,56,0.1);
          border-radius: var(--radius-lg); padding: 16px;
          display: flex; align-items: center; gap: 14px;
        }
        .now-playing-cover {
          width: 72px; height: 72px; border-radius: var(--radius-md); overflow: hidden;
          position: relative; flex-shrink: 0; border: 1px solid var(--border);
        }
        .now-playing-cover img { width: 100%; height: 100%; object-fit: cover; }
        .now-playing-equalizer {
          position: absolute; bottom: 6px; left: 50%; transform: translateX(-50%);
          display: flex; gap: 2px; align-items: flex-end; height: 16px;
        }
        .now-playing-equalizer span {
          width: 3px; background: var(--primary); border-radius: 2px;
          animation: equalizer 0.8s ease-in-out infinite alternate;
        }
        .now-playing-equalizer span:nth-child(1) { height: 8px; animation-delay: 0s; }
        .now-playing-equalizer span:nth-child(2) { height: 14px; animation-delay: 0.2s; }
        .now-playing-equalizer span:nth-child(3) { height: 10px; animation-delay: 0.4s; }
        .now-playing-equalizer span:nth-child(4) { height: 6px; animation-delay: 0.6s; }

        @keyframes equalizer {
          0% { height: 4px; }
          100% { height: 16px; }
        }

        .now-playing-info { flex: 1; min-width: 0; }
        .now-playing-title { font-size: 15px; font-weight: 700; line-height: 1.3; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .now-playing-artist { font-size: 13px; color: var(--text-secondary); margin-bottom: 8px; }

        .now-playing-progress { display: flex; flex-direction: column; gap: 4px; }
        .progress-bar {
          width: 100%; height: 4px; background: var(--surface-card);
          border-radius: 2px; overflow: hidden;
        }
        .progress-fill {
          height: 100%; background: linear-gradient(90deg, var(--gradient-start), var(--gradient-end));
          border-radius: 2px; transition: width 0.3s ease;
        }
        .progress-time { display: flex; justify-content: space-between; font-size: 11px; color: var(--text-tertiary); }

        .mini-player-btn {
          width: 42px; height: 42px; border-radius: var(--radius-full);
          background: linear-gradient(135deg, var(--gradient-start), var(--gradient-end));
          border: none; color: #fff; font-size: 16px; box-shadow: var(--shadow-soft);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all 0.2s ease; flex-shrink: 0;
        }
        .mini-player-btn:active { transform: scale(0.9); }

        /* Section Block */
        .section-block { display: flex; flex-direction: column; }
        .section-block-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 12px;
        }
        .section-block-header h3 { font-size: 16px; font-weight: 700; }
        .section-block-count { font-size: 12px; color: var(--text-tertiary); font-weight: 500; }
        .section-block-count strong { color: var(--text-primary); }

        /* History List */
        .history-list {
          background: var(--surface-card); border: 1px solid var(--border);
          border-radius: var(--radius-lg); overflow: hidden;
        }
        .history-item {
          display: flex; align-items: center; gap: 12px;
          padding: 12px 14px; border-bottom: 1px solid var(--border);
          transition: background 0.2s ease;
        }
        .history-item:last-child { border-bottom: none; }
        .history-item:active { background: var(--surface-elevated); }
        .history-cover {
          width: 36px; height: 36px; border-radius: 6px; object-fit: cover; flex-shrink: 0;
        }
        .history-info { flex: 1; min-width: 0; }
        .history-title { font-size: 13px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .history-artist { font-size: 12px; color: var(--text-secondary); }
        .history-time { font-size: 11px; color: var(--text-tertiary); flex-shrink: 0; }

        /* Quick Actions Row */
        .quick-actions-row {
          display: flex; gap: 10px;
        }
        .quick-action-btn {
          flex: 1; display: flex; flex-direction: column; align-items: center; gap: 8px;
          padding: 16px 8px; background: var(--surface-card); border: 1px solid var(--border);
          border-radius: var(--radius-md); cursor: pointer; transition: all 0.2s ease;
        }
        .quick-action-btn:active { background: var(--surface-elevated); transform: scale(0.96); }
        .quick-action-btn span { font-size: 11px; font-weight: 600; color: var(--text-secondary); text-align: center; }
        .qab-icon {
          width: 44px; height: 44px; border-radius: var(--radius-sm);
          display: flex; align-items: center; justify-content: center; font-size: 18px;
        }
        .qab-icon.gold { background: rgba(232,168,56,0.12); color: var(--primary); }
        .qab-icon.blue { background: rgba(59,130,246,0.12); color: var(--gradient-blue); }
        .qab-icon.purple { background: rgba(139,92,246,0.12); color: var(--gradient-purple); }

        /* Sparkline Chart */
        .sparkline-chart {
          display: flex; align-items: flex-end; gap: 4px;
          height: 120px; background: var(--surface-card);
          border: 1px solid var(--border); border-radius: var(--radius-lg);
          padding: 16px 12px 8px;
        }
        .sparkline-bar {
          flex: 1; display: flex; align-items: flex-end;
          height: 100%; cursor: pointer; position: relative;
        }
        .sparkline-fill {
          width: 100%; border-radius: 3px 3px 0 0;
          background: linear-gradient(to top, rgba(232,168,56,0.3), var(--primary));
          transition: height 0.3s ease; min-height: 2px;
        }
        .sparkline-labels {
          display: flex; justify-content: space-between;
          padding: 6px 12px 0;
        }
        .sparkline-labels span { font-size: 10px; color: var(--text-tertiary); font-weight: 500; }

        /* ========== PLAY CONTROL (integrated in Overview) ========== */
        .ov-pc-dot { width: 7px; height: 7px; border-radius: 50%; display: inline-block; }
        .ov-pc-dot.green { background: var(--success); }
        .ov-pc-dot.gray { background: var(--text-tertiary); }
        .ov-pc-mode-row { display: flex; gap: 6px; margin-bottom: 10px; }
        .ov-pc-mode-btn {
          flex: 1; padding: 8px 6px; border-radius: var(--radius-sm); border: none;
          background: var(--surface-elevated); color: var(--text-secondary);
          font-size: 11px; font-weight: 600; cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 5px;
          transition: all 0.2s ease;
        }
        .ov-pc-mode-btn i { font-size: 12px; }
        .ov-pc-mode-btn.active { background: var(--primary); color: white; }
        .ov-pc-list { display: flex; flex-direction: column; gap: 6px; margin-bottom: 10px; }
        .ov-pc-item {
          display: flex; align-items: center; justify-content: space-between;
          background: var(--surface-card); border: 1px solid var(--border);
          border-radius: var(--radius-sm); padding: 10px 12px;
        }
        .ov-pc-item-info { flex: 1; min-width: 0; }
        .ov-pc-item-name { font-size: 13px; font-weight: 600; }
        .ov-pc-item-sub { font-size: 11px; color: var(--text-tertiary); margin-top: 1px; }
        .ov-pc-play-btn {
          width: 32px; height: 32px; border-radius: 50%; border: none;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all 0.2s ease; flex-shrink: 0;
          background: var(--primary); color: white; font-size: 12px;
        }
        .ov-pc-play-btn.active { background: rgba(74,222,128,0.15); color: var(--success); }
        .ov-pc-play-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .ov-pc-active {
          display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600;
          color: var(--success); padding: 8px 0 4px;
        }
        .ov-pc-now-playing {
          display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600;
          color: var(--success); padding: 6px 0; margin-bottom: 2px;
        }
        .ov-pc-empty { font-size: 12px; color: var(--text-tertiary); padding: 12px 0; text-align: center; }
        .ov-pc-queue-header {
          display: flex; align-items: center; justify-content: space-between;
          font-size: 12px; font-weight: 700; color: var(--text-secondary);
          text-transform: uppercase; letter-spacing: 0.5px; margin-top: 4px;
        }
        .ov-pc-queue-count { font-size: 10px; color: var(--text-tertiary); font-weight: 600; text-transform: none; }
        .ov-pc-queue { background: var(--surface-card); border: 1px solid var(--border); border-radius: var(--radius-sm); overflow: hidden; }
        .ov-pc-q-item { display: flex; align-items: center; gap: 8px; padding: 8px 10px; border-bottom: 1px solid var(--border); }
        .ov-pc-q-item:last-child { border-bottom: none; }
        .ov-pc-q-num {
          width: 18px; height: 18px; border-radius: 50%; background: var(--surface-elevated);
          display: flex; align-items: center; justify-content: center;
          font-size: 9px; font-weight: 700; color: var(--text-tertiary); flex-shrink: 0;
        }
        .ov-pc-q-info { flex: 1; min-width: 0; }
        .ov-pc-q-title { font-size: 12px; font-weight: 600; }
        .ov-pc-q-artist { font-size: 10px; color: var(--text-tertiary); }

        /* ========== GO LIVE SECTION ========== */
        .go-live-content { padding: 16px; display: flex; flex-direction: column; gap: 16px; }

        .gl-dj-frame-wrap {
          width: 100%; height: 420px; border-radius: var(--radius-lg);
          overflow: hidden; border: 1px solid var(--border);
          background: var(--surface-card);
        }
        .gl-dj-frame {
          width: 100%; height: 100%; border: none;
        }
        .gl-conn-toggle {
          display: flex; align-items: center; gap: 6px;
          padding: 10px 16px; border-radius: var(--radius-md);
          border: 1px solid var(--border); background: var(--surface-card);
          color: var(--text-secondary); font-size: 13px; font-weight: 600; cursor: pointer;
          transition: all 0.2s ease; width: 100%;
        }
        .gl-conn-toggle:hover { border-color: var(--primary); color: var(--text-primary); }

        .gl-status-banner {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 18px; border-radius: var(--radius-lg);
          border: 1px solid var(--border);
        }
        .gl-status-banner.live {
          background: linear-gradient(135deg, rgba(239,68,68,0.1), rgba(239,68,68,0.04));
          border-color: rgba(239,68,68,0.2);
        }
        .gl-status-banner.idle {
          background: var(--surface-card);
        }
        .gl-status-left { display: flex; align-items: center; gap: 10px; }
        .gl-status-dot {
          width: 10px; height: 10px; border-radius: var(--radius-full);
          background: var(--text-tertiary);
        }
        .gl-status-dot.pulse-red {
          background: var(--error);
          animation: livePulse 1.5s ease-in-out infinite;
          box-shadow: 0 0 12px rgba(239,68,68,0.4);
        }
        .gl-status-text { font-size: 15px; font-weight: 700; }

        .gl-timer {
          display: flex; align-items: center; gap: 6px;
          font-size: 14px; font-weight: 700; font-variant-numeric: tabular-nums;
          color: var(--error);
        }
        .gl-timer i { font-size: 12px; }

        .gl-section { display: flex; flex-direction: column; gap: 8px; }
        .gl-section-label {
          font-size: 12px; font-weight: 600; color: var(--text-secondary);
          text-transform: uppercase; letter-spacing: 0.5px;
          display: flex; align-items: center; gap: 6px;
        }
        .gl-section-label i { font-size: 11px; color: var(--text-tertiary); }

        .gl-now-playing {
          background: var(--surface-card); border: 1px solid var(--border);
          border-radius: var(--radius-md); padding: 14px 16px;
        }
        .gl-np-title { font-size: 15px; font-weight: 700; display: block; margin-bottom: 2px; }
        .gl-np-artist { font-size: 13px; color: var(--text-secondary); }

        .gl-select {
          width: 100%; padding: 14px 16px;
          background: var(--surface-card); border: 1.5px solid var(--border);
          border-radius: var(--radius-md); color: var(--text-primary);
          font-size: 15px; font-weight: 500; outline: none;
          appearance: none; -webkit-appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%236B6B6B' viewBox='0 0 16 16'%3E%3Cpath d='M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E");
          background-repeat: no-repeat; background-position: right 14px center; padding-right: 40px;
        }
        .gl-select:focus { border-color: var(--primary); box-shadow: 0 0 0 4px rgba(232,168,56,0.08); }
        .gl-select:disabled { opacity: 0.5; }

        .gl-input {
          width: 100%; padding: 14px 16px;
          background: var(--surface-card); border: 1.5px solid var(--border);
          border-radius: var(--radius-md); color: var(--text-primary);
          font-size: 15px; font-weight: 500; outline: none;
        }
        .gl-input:focus { border-color: var(--primary); box-shadow: 0 0 0 4px rgba(232,168,56,0.08); }
        .gl-input::placeholder { color: var(--text-tertiary); font-weight: 400; }
        .gl-input:disabled { opacity: 0.5; }

        /* Audio Level Meter */
        .gl-level-meter {
          display: flex; align-items: flex-end; gap: 3px;
          height: 48px; background: var(--surface-card);
          border: 1px solid var(--border); border-radius: var(--radius-md);
          padding: 6px 10px;
        }
        .level-bar {
          flex: 1; height: 4px; border-radius: 2px;
          background: var(--surface-elevated); transition: all 0.08s ease;
          align-self: flex-end;
        }
        .level-bar.level-low { background: var(--gradient-green); }
        .level-bar.level-mid { background: var(--gradient-start); }
        .level-bar.level-high { background: var(--error); }
        .gl-level-value {
          text-align: center; font-size: 13px; font-weight: 700;
          color: var(--text-secondary); font-variant-numeric: tabular-nums;
        }

        /* GO LIVE Button */
        .gl-broadcast-btn {
          width: 100%; padding: 20px; border-radius: var(--radius-xl);
          font-size: 20px; font-weight: 800; cursor: pointer; transition: all 0.3s ease;
          display: flex; align-items: center; justify-content: center; gap: 12px;
          border: none; letter-spacing: 1px;
        }
        .gl-broadcast-btn:active { transform: scale(0.97); }
        .gl-broadcast-btn.start {
          background: linear-gradient(135deg, var(--gradient-start), var(--gradient-end));
          color: #fff; box-shadow: var(--shadow-soft), 0 0 40px rgba(232,168,56,0.2);
        }
        .gl-broadcast-btn.end {
          background: linear-gradient(135deg, var(--gradient-red), #DC2626);
          color: #fff; box-shadow: 0 4px 24px rgba(239,68,68,0.35);
          animation: pulseShadow 2s ease-in-out infinite;
        }
        .gl-broadcast-btn i { font-size: 22px; }

        @keyframes pulseShadow {
          0%, 100% { box-shadow: 0 4px 24px rgba(239,68,68,0.35); }
          50% { box-shadow: 0 4px 40px rgba(239,68,68,0.55); }
        }

        /* Stream Quality */
        .gl-quality-options {
          display: flex; gap: 10px;
        }
        .gl-quality-btn {
          flex: 1; padding: 12px; border-radius: var(--radius-md);
          font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.2s ease;
          border: 1.5px solid var(--border); background: var(--surface-card);
          color: var(--text-secondary); text-align: center;
        }
        .gl-quality-btn:active { transform: scale(0.96); }
        .gl-quality-btn.active {
          background: linear-gradient(135deg, var(--gradient-start), var(--gradient-end));
          border-color: transparent; color: #fff; box-shadow: var(--shadow-soft);
        }
        .gl-quality-btn:disabled { opacity: 0.5; }

        /* Tech Info */
        .gl-tech-info {
          background: var(--surface-card); border: 1px solid var(--border);
          border-radius: var(--radius-lg); padding: 16px;
          display: flex; flex-direction: column; gap: 12px;
          animation: fadeSlideUp 0.3s ease;
        }
        .gl-tech-row {
          display: flex; align-items: center; justify-content: space-between;
          font-size: 13px;
        }
        .gl-tech-row span:first-child { color: var(--text-tertiary); font-weight: 500; }
        .gl-tech-value {
          font-weight: 600; font-size: 12px;
          color: var(--text-secondary); font-family: monospace;
          max-width: 60%; text-align: right; word-break: break-all;
        }

        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* ========== MEDIA LIBRARY SECTION ========== */
        .media-content { padding: 16px; display: flex; flex-direction: column; gap: 14px; }

        .upload-zone {
          display: flex; flex-direction: column; align-items: center; gap: 10px;
          padding: 28px 20px; background: var(--surface-card);
          border: 2px dashed var(--border); border-radius: var(--radius-lg);
          cursor: pointer; transition: all 0.25s ease; text-align: center;
        }
        .upload-zone:active { background: var(--surface-elevated); border-color: var(--primary); }
        .upload-zone.dragging {
          background: rgba(232,168,56,0.06); border-color: var(--primary);
          transform: scale(1.01);
        }
        .upload-zone i { font-size: 36px; color: var(--text-tertiary); transition: all 0.25s ease; }
        .upload-zone.dragging i { color: var(--primary); transform: translateY(-4px); }
        .upload-zone-text h4 { font-size: 15px; font-weight: 600; margin-bottom: 2px; }
        .upload-zone-text p { font-size: 13px; color: var(--text-tertiary); }

        /* Upload Progress */
        .upload-progress-list { display: flex; flex-direction: column; gap: 10px; }
        .upload-progress-item {
          background: var(--surface-card); border: 1px solid var(--border);
          border-radius: var(--radius-md); padding: 12px 14px;
          animation: fadeSlideUp 0.25s ease;
        }
        .upload-progress-info {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 8px;
        }
        .upload-progress-name {
          font-size: 13px; font-weight: 600; display: flex; align-items: center; gap: 6px;
        }
        .upload-progress-name i { color: var(--primary); font-size: 14px; }
        .upload-progress-pct { font-size: 12px; font-weight: 700; color: var(--primary); font-variant-numeric: tabular-nums; }
        .upload-progress-bar {
          width: 100%; height: 4px; background: var(--surface-elevated);
          border-radius: 2px; overflow: hidden;
        }
        .upload-progress-fill {
          height: 100%; background: linear-gradient(90deg, var(--gradient-start), var(--gradient-end));
          border-radius: 2px; transition: width 0.3s ease;
        }

        /* Media Toolbar */
        .media-toolbar { display: flex; flex-direction: column; gap: 10px; }
        .media-search-wrapper {
          position: relative; display: flex; align-items: center;
        }
        .media-search-wrapper > i {
          position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
          color: var(--text-tertiary); font-size: 15px; pointer-events: none;
        }
        .media-search-input {
          width: 100%; padding: 12px 40px 12px 42px;
          background: var(--surface-card); border: 1.5px solid var(--border);
          border-radius: var(--radius-md); color: var(--text-primary);
          font-size: 14px; font-weight: 500; outline: none;
        }
        .media-search-input:focus { border-color: var(--primary); box-shadow: 0 0 0 4px rgba(232,168,56,0.08); }
        .media-search-input::placeholder { color: var(--text-tertiary); font-weight: 400; }
        .media-search-clear {
          position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
          width: 28px; height: 28px; border-radius: var(--radius-full);
          background: var(--surface-elevated); border: none;
          color: var(--text-secondary); font-size: 12px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
        }
        .media-search-clear:active { background: var(--surface-hover); }

        .media-filter-select {
          width: 100%; padding: 12px 16px;
          background: var(--surface-card); border: 1.5px solid var(--border);
          border-radius: var(--radius-md); color: var(--text-primary);
          font-size: 13px; font-weight: 500; outline: none;
          appearance: none; -webkit-appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%236B6B6B' viewBox='0 0 16 16'%3E%3Cpath d='M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E");
          background-repeat: no-repeat; background-position: right 14px center; padding-right: 40px;
        }
        .media-filter-select:focus { border-color: var(--primary); box-shadow: 0 0 0 4px rgba(232,168,56,0.08); }

        /* Bulk Actions */
        .media-bulk-bar {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 14px; background: rgba(232,168,56,0.08);
          border: 1px solid rgba(232,168,56,0.15);
          border-radius: var(--radius-md);
          animation: fadeSlideUp 0.2s ease;
        }
        .media-bulk-count { font-size: 13px; font-weight: 700; color: var(--primary); flex-shrink: 0; }
        .media-bulk-actions { display: flex; gap: 8px; flex: 1; justify-content: flex-end; }
        .media-bulk-btn {
          padding: 8px 12px; border-radius: var(--radius-sm);
          font-size: 12px; font-weight: 600; cursor: pointer;
          border: none; display: flex; align-items: center; gap: 5px;
          background: var(--surface-elevated); color: var(--text-primary);
          transition: all 0.2s ease;
        }
        .media-bulk-btn:active { transform: scale(0.95); }
        .media-bulk-btn.danger { background: rgba(239,68,68,0.12); color: var(--error); }
        .media-bulk-clear {
          width: 28px; height: 28px; border-radius: var(--radius-full);
          background: none; border: none; color: var(--text-tertiary);
          cursor: pointer; font-size: 14px; display: flex; align-items: center; justify-content: center;
        }
        .media-bulk-clear:active { background: var(--surface-elevated); }

        /* File Count */
        .media-count { font-size: 12px; color: var(--text-tertiary); font-weight: 500; text-align: right; }

        /* File List */
        .media-file-list {
          background: var(--surface-card); border: 1px solid var(--border);
          border-radius: var(--radius-lg); overflow: hidden;
        }
        .media-empty {
          display: flex; flex-direction: column; align-items: center; gap: 8px;
          padding: 40px 20px; text-align: center;
        }
        .media-empty i { font-size: 32px; color: var(--text-tertiary); }
        .media-empty p { font-size: 14px; color: var(--text-secondary); }

        .media-file-item {
          display: flex; align-items: flex-start; gap: 12px;
          padding: 14px; border-bottom: 1px solid var(--border);
          transition: background 0.2s ease; position: relative;
        }
        .media-file-item:last-child { border-bottom: none; }
        .media-file-item.selected { background: rgba(232,168,56,0.04); }

        .media-checkbox {
          width: 22px; height: 22px; border-radius: 6px;
          border: 2px solid var(--border); flex-shrink: 0;
          margin-top: 6px; cursor: pointer; transition: all 0.2s ease;
          display: flex; align-items: center; justify-content: center;
        }
        .media-checkbox.checked {
          background: var(--primary); border-color: var(--primary);
        }
        .media-checkbox i { font-size: 11px; color: #fff; }

        .media-file-cover {
          width: 44px; height: 44px; border-radius: 8px; overflow: hidden;
          flex-shrink: 0; border: 1px solid var(--border);
        }
        .media-file-cover img { width: 100%; height: 100%; object-fit: cover; }

        .media-file-info { flex: 1; min-width: 0; }
        .media-file-title { font-size: 14px; font-weight: 600; line-height: 1.3; margin-bottom: 2px; }
        .media-file-artist { font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; }
        .media-file-tags {
          display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 4px;
        }
        .media-file-tag {
          padding: 2px 8px; border-radius: 4px;
          font-size: 10px; font-weight: 600; color: var(--text-tertiary);
          background: var(--surface-elevated);
        }
        .media-file-playlists {
          display: flex; gap: 4px; flex-wrap: wrap;
        }
        .media-playlist-chip {
          padding: 2px 8px; border-radius: 4px;
          font-size: 10px; font-weight: 600;
          background: rgba(232,168,56,0.1); color: var(--primary);
        }

        /* File Menu */
        .media-file-actions-relative { position: relative; }
        .media-file-menu {
          width: 32px; height: 32px; border-radius: var(--radius-full);
          background: none; border: none; color: var(--text-tertiary);
          font-size: 16px; cursor: pointer; display: flex;
          align-items: center; justify-content: center; flex-shrink: 0;
        }
        .media-file-menu:active { background: var(--surface-elevated); color: var(--text-primary); }

        /* Action Sheet */
        .media-actions-overlay {
          position: fixed; inset: 0; z-index: 9999;
        }
        .media-actions-sheet {
          z-index: 10000;
          width: 240px; background: var(--surface-elevated);
          border: 1px solid var(--border); border-radius: var(--radius-md);
          padding: 8px; box-shadow: var(--shadow-elevated);
          animation: fadeSlideUp 0.15s ease;
        }
        .media-action-btn {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 8px; border-radius: 8px;
          background: none; border: none; color: var(--text-primary);
          width: 100%; text-align: left; cursor: pointer;
          transition: background 0.2s ease;
        }
        .media-action-btn:active { background: var(--surface-hover); }
        .media-action-icon {
          width: 34px; height: 34px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          font-size: 15px; flex-shrink: 0;
        }
        .media-action-icon.blue { background: rgba(59,130,246,0.12); color: var(--gradient-blue); }
        .media-action-icon.gold { background: rgba(232,168,56,0.12); color: var(--primary); }
        .media-action-icon.red { background: rgba(239,68,68,0.12); color: var(--error); }
        .media-action-info { flex: 1; }
        .media-action-info h4 { font-size: 14px; font-weight: 600; }
        .media-action-info p { font-size: 11px; color: var(--text-secondary); margin-top: 1px; }

        /* Inline Edit Fields */
        .media-edit-fields { display: flex; flex-direction: column; gap: 6px; }
        .media-edit-input {
          padding: 8px 10px; border-radius: 6px;
          background: var(--surface-elevated); border: 1.5px solid var(--border);
          color: var(--text-primary); font-size: 13px; font-weight: 500;
          outline: none; width: 100%;
        }
        .media-edit-input:focus { border-color: var(--primary); }
        .media-edit-input::placeholder { color: var(--text-tertiary); }
        .media-edit-actions {
          display: flex; gap: 6px; margin-top: 2px;
        }
        .media-edit-save, .media-edit-cancel {
          padding: 6px 12px; border-radius: 6px;
          font-size: 12px; font-weight: 600; cursor: pointer;
          border: none; transition: all 0.2s ease;
        }
        .media-edit-save {
          background: linear-gradient(135deg, var(--gradient-start), var(--gradient-end));
          color: #fff;
        }
        .media-edit-save:active { transform: scale(0.95); }
        .media-edit-cancel {
          background: var(--surface-elevated); color: var(--text-secondary);
        }
        .media-edit-cancel:active { transform: scale(0.95); }

        /* Playlist Picker Modal */
        .media-modal-overlay {
          position: fixed; inset: 0; background: var(--overlay);
          z-index: 9000; animation: fadeSlideUp 0.2s ease;
        }
        .media-modal-sheet {
          position: fixed; bottom: 0; left: 0; right: 0; z-index: 9001;
          max-width: 480px; margin: 0 auto;
          background: var(--surface);
          border-radius: 28px 28px 0 0;
          animation: slideUp 0.35s cubic-bezier(0.32, 0.72, 0, 1);
          max-height: 80vh; display: flex; flex-direction: column;
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .media-modal-handle {
          width: 40px; height: 5px; background: var(--text-tertiary);
          border-radius: 3px; margin: 12px auto 8px; opacity: 0.5;
        }
        .media-modal-header {
          padding: 8px 24px 16px; text-align: center;
        }
        .media-modal-header h2 { font-size: 20px; font-weight: 700; }
        .media-modal-header p { font-size: 13px; color: var(--text-secondary); margin-top: 4px; }
        .media-modal-body {
          flex: 1; overflow-y: auto; padding: 0 24px 20px;
          -webkit-overflow-scrolling: touch;
        }
        .media-modal-body::-webkit-scrollbar { display: none; }

        .media-pl-item {
          display: flex; align-items: center; gap: 14px;
          padding: 14px 0; border-bottom: 1px solid var(--border);
          cursor: pointer; transition: opacity 0.2s ease;
        }
        .media-pl-item:last-child { border-bottom: none; }
        .media-pl-item:active { opacity: 0.6; }
        .media-pl-icon {
          width: 40px; height: 40px; border-radius: var(--radius-sm);
          background: rgba(232,168,56,0.1); color: var(--primary);
          display: flex; align-items: center; justify-content: center;
          font-size: 18px; flex-shrink: 0;
        }
        .media-pl-info { flex: 1; }
        .media-pl-name { font-size: 15px; font-weight: 600; }
        .media-pl-arrow { font-size: 14px; color: var(--text-tertiary); }

        /* ========== PLACEHOLDER SECTION ========== */
        .placeholder-section {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          padding: 60px 40px; text-align: center; gap: 12px;
        }
        .placeholder-icon {
          width: 64px; height: 64px; border-radius: var(--radius-full);
          background: var(--surface-elevated); display: flex; align-items: center; justify-content: center;
          font-size: 24px; color: var(--text-tertiary);
        }
        .placeholder-section h2 { font-size: 20px; font-weight: 700; }
        .placeholder-section p { font-size: 14px; color: var(--text-secondary); line-height: 1.6; max-width: 280px; }

        /* ========== BOTTOM NAV ========== */
        .bottom-nav {
          position: fixed; bottom: 0; left: 0; right: 0;
          background: rgba(15,15,15,0.92);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          border-top: 1px solid var(--border);
          padding: 8px 0 calc(8px + env(safe-area-inset-bottom, 0px));
          z-index: 1000; display: flex; justify-content: space-around; align-items: center;
        }
        @media (min-width: 480px) {
          .bottom-nav { max-width: 480px; margin: 0 auto; }
        }
        .nav-item {
          display: flex; flex-direction: column; align-items: center; gap: 4px;
          padding: 6px 12px; background: none; border: none;
          color: var(--text-tertiary); cursor: pointer; transition: all 0.2s ease; position: relative;
        }
        .nav-item.active { color: var(--primary); }
        .nav-item i { font-size: 20px; transition: transform 0.2s ease; }
        .nav-item:active i { transform: scale(0.85); }
        .nav-item span { font-size: 10px; font-weight: 600; }
        .nav-item .nav-badge {
          position: absolute; top: 2px; right: 6px; width: 8px; height: 8px;
          background: var(--error); border-radius: var(--radius-full); border: 2px solid var(--bg);
        }
        /* ========== PLAYLISTS SECTION ========== */
        .pl-content { padding: 16px; display: flex; flex-direction: column; gap: 14px; }
        .pl-toolbar { display: flex; gap: 10px; align-items: center; }
        .pl-search-wrapper { position: relative; flex: 1; }
        .pl-search-wrapper > i { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-tertiary); font-size: 14px; pointer-events: none; }
        .pl-search-input { width: 100%; padding: 10px 12px 10px 36px; background: var(--surface-card); border: 1.5px solid var(--border); border-radius: var(--radius-md); color: var(--text-primary); font-size: 13px; font-weight: 500; outline: none; }
        .pl-search-input:focus { border-color: var(--primary); }
        .pl-picker-toolbar { position: relative; margin: 0 20px 8px; }
        .pl-picker-toolbar > i { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-tertiary); font-size: 14px; pointer-events: none; }
        .pl-picker-search { width: 100%; padding: 10px 12px 10px 36px; background: var(--surface-elevated); border: 1.5px solid var(--border); border-radius: var(--radius-md); color: var(--text-primary); font-size: 13px; outline: none; box-sizing: border-box; }
        .pl-picker-search:focus { border-color: var(--primary); }
        .pl-create-btn { display: flex; align-items: center; gap: 6px; padding: 10px 16px; background: linear-gradient(135deg, var(--gradient-start), var(--gradient-end)); border: none; border-radius: var(--radius-md); color: #fff; font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.2s ease; white-space: nowrap; box-shadow: var(--shadow-soft); }
        .pl-create-btn:active { transform: scale(0.95); }
        .pl-refresh-btn { display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; background: var(--surface-card); border: 1.5px solid var(--border); border-radius: var(--radius-md); color: var(--text-secondary); font-size: 15px; cursor: pointer; transition: all 0.2s ease; flex-shrink: 0; }
        .pl-refresh-btn:hover { border-color: var(--primary); color: var(--primary); }
        .pl-refresh-btn:active { transform: scale(0.92); }
        .pl-count { font-size: 12px; color: var(--text-tertiary); font-weight: 500; text-align: right; }
        .pl-create-form, .dj-form, .wh-form { background: var(--surface-card); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 18px; display: flex; flex-direction: column; gap: 14px; animation: fadeSlideUp 0.25s ease; }
        .pl-create-form h4, .dj-form h4, .wh-form h4 { font-size: 16px; font-weight: 700; }
        .pl-form-row { display: flex; flex-direction: column; gap: 6px; }
        .pl-form-row label { font-size: 12px; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; }
        .pl-form-input { padding: 11px 14px; background: var(--surface-elevated); border: 1.5px solid var(--border); border-radius: var(--radius-sm); color: var(--text-primary); font-size: 14px; font-weight: 500; outline: none; color-scheme: dark; }
        .pl-form-input:focus { border-color: var(--primary); }
        .pl-form-input[type="time"]::-webkit-calendar-picker-indicator { filter: invert(0.7); cursor: pointer; }
        .pl-form-input[type="time"]::-webkit-datetime-edit { color: var(--text-primary); }
        .pl-form-select { padding: 11px 14px; background: var(--surface-elevated); border: 1.5px solid var(--border); border-radius: var(--radius-sm); color: var(--text-primary); font-size: 14px; font-weight: 500; outline: none; appearance: none; -webkit-appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' fill='%236B6B6B' viewBox='0 0 16 16'%3E%3Cpath d='M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 12px center; padding-right: 36px; }
        .pl-form-select:focus { border-color: var(--primary); }
        .pl-form-range { width: 100%; height: 6px; -webkit-appearance: none; appearance: none; background: var(--surface-elevated); border-radius: 3px; outline: none; }
        .pl-form-range::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 20px; height: 20px; border-radius: 50%; background: var(--primary); cursor: pointer; box-shadow: var(--shadow-soft); }
        .pl-form-actions { display: flex; gap: 8px; margin-top: 4px; }
        .pl-form-save { padding: 10px 20px; background: linear-gradient(135deg, var(--gradient-start), var(--gradient-end)); border: none; border-radius: var(--radius-sm); color: #fff; font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.2s ease; }
        .pl-form-save:active { transform: scale(0.95); }
        .pl-form-cancel { padding: 10px 20px; background: var(--surface-elevated); border: none; border-radius: var(--radius-sm); color: var(--text-secondary); font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s ease; }
        .pl-form-cancel:active { transform: scale(0.95); }
        .pl-schedule-config { background: var(--surface-elevated); border-radius: var(--radius-md); padding: 14px; display: flex; flex-direction: column; gap: 12px; }
        .pl-day-chips { display: flex; gap: 6px; flex-wrap: wrap; }
        .pl-day-chip { padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 600; border: 1.5px solid var(--border); background: transparent; color: var(--text-secondary); cursor: pointer; transition: all 0.2s ease; }
        .pl-day-chip:active { transform: scale(0.95); }
        .pl-day-chip.active { background: var(--primary); border-color: var(--primary); color: #fff; }
        .pl-time-row { display: flex; gap: 12px; }
        .pl-time-row > div { flex: 1; display: flex; flex-direction: column; gap: 6px; }
        .pl-time-row label { font-size: 11px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.5px; }
        .pl-list { display: flex; flex-direction: column; gap: 8px; }
        .pl-card { background: var(--surface-card); border: 1px solid var(--border); border-radius: var(--radius-lg); overflow: hidden; transition: all 0.2s ease; }
        .pl-card.expanded { border-color: rgba(232,168,56,0.2); }
        .pl-card-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; cursor: pointer; transition: background 0.2s ease; }
        .pl-card-header:active { background: var(--surface-hover); }
        .pl-card-left { display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0; }
        .pl-type-badge { padding: 3px 10px; border-radius: 6px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; flex-shrink: 0; }
        .pl-type-badge.standard { background: rgba(59,130,246,0.12); color: #3B82F6; }
        .pl-type-badge.scheduled { background: rgba(232,168,56,0.12); color: var(--primary); }
        .pl-type-badge.ondemand { background: rgba(139,92,246,0.12); color: #8B5CF6; }
        .pl-card-info { min-width: 0; }
        .pl-card-name { font-size: 15px; font-weight: 600; }
        .pl-card-meta { font-size: 12px; color: var(--text-tertiary); margin-top: 2px; }
        .pl-card-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
        .pl-card-delete { width: 30px; height: 30px; border-radius: 50%; background: none; border: none; color: var(--text-tertiary); font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
        .pl-card-delete:active { background: rgba(239,68,68,0.1); color: var(--error); }
        .pl-chevron { font-size: 14px; color: var(--text-tertiary); transition: transform 0.25s ease; }
        .pl-chevron.open { transform: rotate(180deg); color: var(--primary); }
        .pl-toggle { position: relative; display: inline-block; width: 42px; height: 24px; cursor: pointer; }
        .pl-toggle input { display: none; }
        .pl-toggle-slider { position: absolute; inset: 0; background: var(--surface-elevated); border-radius: 12px; transition: all 0.25s ease; }
        .pl-toggle-slider::before { content: ''; position: absolute; left: 3px; top: 3px; width: 18px; height: 18px; background: var(--text-tertiary); border-radius: 50%; transition: all 0.25s ease; }
        .pl-toggle input:checked + .pl-toggle-slider { background: var(--primary); }
        .pl-toggle input:checked + .pl-toggle-slider::before { background: #fff; transform: translateX(18px); }
        .pl-song-list { border-top: 1px solid var(--border); padding: 10px 16px 14px; display: flex; flex-direction: column; gap: 6px; }
        .pl-empty-songs { text-align: center; padding: 20px; color: var(--text-tertiary); font-size: 13px; }
        .pl-song-item { display: flex; align-items: center; gap: 10px; padding: 6px 0; }
        .pl-song-idx { width: 20px; text-align: center; font-size: 12px; color: var(--text-tertiary); font-weight: 600; }
        .pl-song-cover { width: 32px; height: 32px; border-radius: 6px; object-fit: cover; flex-shrink: 0; border: 1px solid var(--border); }
        .pl-song-info { flex: 1; min-width: 0; }
        .pl-song-title { font-size: 13px; font-weight: 600; }
        .pl-song-artist { font-size: 11px; color: var(--text-secondary); }
        .pl-song-remove { width: 28px; height: 28px; border-radius: 50%; background: none; border: none; color: var(--text-tertiary); cursor: pointer; font-size: 14px; display: flex; align-items: center; justify-content: center; }
        .pl-song-remove:active { background: rgba(239,68,68,0.1); color: var(--error); }
        .pl-add-songs-btn { display: flex; align-items: center; justify-content: center; gap: 6px; padding: 10px; border: 1.5px dashed var(--border); border-radius: var(--radius-sm); background: transparent; color: var(--primary); font-size: 13px; font-weight: 600; cursor: pointer; margin-top: 4px; transition: all 0.2s ease; }
        .pl-add-songs-btn:active { background: rgba(232,168,56,0.05); border-color: var(--primary); }
        .pl-schedule-info { display: flex; align-items: center; gap: 8px; padding: 8px 10px; background: rgba(232,168,56,0.06); border-radius: var(--radius-sm); margin-top: 6px; font-size: 12px; color: var(--primary); }
        .pl-schedule-info i { font-size: 14px; }
        .pl-schedule-time { margin-left: auto; font-weight: 600; }
        .pl-picker-item { display: flex; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid var(--border); cursor: pointer; transition: opacity 0.2s ease; }
        .pl-picker-item:last-child { border-bottom: none; }
        .pl-picker-item.disabled { opacity: 0.4; cursor: default; }
        .pl-picker-item:not(.disabled):active { opacity: 0.6; }
        .pl-picker-cover { width: 36px; height: 36px; border-radius: 6px; object-fit: cover; border: 1px solid var(--border); }
        .pl-picker-info { flex: 1; min-width: 0; }
        .pl-picker-title { font-size: 14px; font-weight: 600; }
        .pl-picker-artist { font-size: 12px; color: var(--text-secondary); }
        .pl-picker-add { color: var(--primary); font-size: 20px; }
        .pl-picker-checked { color: var(--success); font-size: 18px; }
        /* ========== DJ ACCOUNTS SECTION ========== */
        .dj-content { padding: 16px; display: flex; flex-direction: column; gap: 14px; }
        .dj-toolbar { display: flex; gap: 10px; }
        .dj-list { display: flex; flex-direction: column; gap: 8px; }
        .dj-card { background: var(--surface-card); border: 1px solid var(--border); border-radius: var(--radius-lg); overflow: hidden; transition: all 0.2s ease; }
        .dj-card.expanded { border-color: rgba(232,168,56,0.2); }
        .dj-card-header { display: flex; align-items: center; gap: 12px; padding: 14px 16px; cursor: pointer; transition: background 0.2s ease; }
        .dj-card-header:active { background: var(--surface-hover); }
        .dj-avatar { width: 42px; height: 42px; border-radius: 50%; object-fit: cover; border: 2px solid var(--border); flex-shrink: 0; }
        .dj-card-info { flex: 1; min-width: 0; }
        .dj-card-name { font-size: 15px; font-weight: 600; display: flex; align-items: center; gap: 8px; }
        .dj-live-badge { display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; background: rgba(239,68,68,0.1); border-radius: 10px; font-size: 10px; font-weight: 700; color: var(--error); text-transform: uppercase; }
        .dj-live-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--error); animation: livePulse 1.5s ease-in-out infinite; }
        .dj-card-username { font-size: 12px; color: var(--text-tertiary); margin-top: 2px; }
        .dj-card-actions { display: flex; align-items: center; gap: 4px; flex-shrink: 0; }
        .dj-action-btn { width: 30px; height: 30px; border-radius: 50%; background: none; border: none; color: var(--text-tertiary); font-size: 13px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
        .dj-action-btn:active { background: var(--surface-elevated); color: var(--text-primary); }
        .dj-action-btn.danger:active { background: rgba(239,68,68,0.1); color: var(--error); }
        .dj-edit-form { border-top: 1px solid var(--border); padding: 14px 16px; display: flex; flex-direction: column; gap: 10px; }
        .dj-history { border-top: 1px solid var(--border); padding: 12px 16px; }
        .dj-history-title { font-size: 12px; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
        .dj-history-item { display: flex; align-items: center; gap: 12px; padding: 6px 0; font-size: 13px; }
        .dj-history-date { color: var(--text-primary); font-weight: 500; flex: 1; }
        .dj-history-time { color: var(--text-secondary); }
        .dj-history-duration { color: var(--text-tertiary); font-weight: 500; }
        /* ========== SCHEDULE SECTION ========== */
        .sched-content { padding: 16px; display: flex; flex-direction: column; gap: 14px; }
        .sched-header-info { display: flex; align-items: center; justify-content: space-between; }
        .sched-header-info h3 { font-size: 16px; font-weight: 700; }
        .sched-grid-wrapper { overflow-x: auto; -webkit-overflow-scrolling: touch; }
        .sched-grid-wrapper::-webkit-scrollbar { display: none; }
        .sched-grid { display: grid; grid-template-columns: 56px repeat(7, 1fr); gap: 1px; background: var(--border); border: 1px solid var(--border); border-radius: var(--radius-md); overflow: hidden; min-width: 600px; }
        .sched-time-header, .sched-day-header { background: var(--surface-card); padding: 8px 6px; text-align: center; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-secondary); }
        .sched-day-header.today { background: rgba(232,168,56,0.1); color: var(--primary); }
        .sched-time-cell { background: var(--surface-card); padding: 4px 6px; font-size: 10px; color: var(--text-tertiary); font-weight: 500; text-align: right; display: flex; align-items: flex-start; justify-content: flex-end; }
        .sched-cell { background: var(--surface-elevated); min-height: 28px; padding: 2px; position: relative; cursor: pointer; transition: background 0.15s ease; }
        .sched-cell:hover { background: var(--surface-hover); }
        .sched-cell.today { background: rgba(232,168,56,0.03); }
        .sched-cell.has-block { padding: 1px; }
        .sched-block { height: 100%; border-radius: 3px; padding: 2px 4px; font-size: 9px; font-weight: 700; color: #fff; display: flex; align-items: center; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
        .sched-empty-slot { width: 100%; height: 100%; }
        .sched-now-line { position: absolute; top: 0; left: 0; right: 0; height: 2px; background: var(--error); border-radius: 1px; animation: livePulse 1.5s ease-in-out infinite; }
        .sched-legend { display: flex; flex-wrap: wrap; gap: 10px; padding: 4px 0; }
        .sched-legend-item { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-secondary); }
        .sched-legend-dot { width: 10px; height: 10px; border-radius: 3px; flex-shrink: 0; }
        .sched-legend-name { font-weight: 500; }
        .sched-modal-actions { display: flex; flex-direction: column; gap: 10px; padding: 8px 0; }
        .sched-delete-btn { padding: 12px; border-radius: var(--radius-sm); font-size: 14px; font-weight: 600; cursor: pointer; background: rgba(239,68,68,0.1); color: var(--error); border: none; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s ease; }
        .sched-delete-btn:active { background: rgba(239,68,68,0.2); }
        /* ========== ANALYTICS SECTION ========== */
        .an-content { padding: 16px; display: flex; flex-direction: column; gap: 16px; }
        .an-period-toggle { display: flex; background: var(--surface-card); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 4px; }
        .an-period-btn { flex: 1; padding: 10px; border-radius: var(--radius-sm); font-size: 13px; font-weight: 600; border: none; background: transparent; color: var(--text-secondary); cursor: pointer; transition: all 0.2s ease; }
        .an-period-btn.active { background: linear-gradient(135deg, var(--gradient-start), var(--gradient-end)); color: #fff; box-shadow: var(--shadow-soft); }
        .an-period-btn:not(.active):active { background: var(--surface-elevated); }
        .an-stats-row { display: flex; gap: 12px; }
        .an-stat-card { flex: 1; background: var(--surface-card); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 18px; text-align: center; }
        .an-stat-value { font-size: 32px; font-weight: 800; line-height: 1; background: linear-gradient(135deg, var(--gradient-start), var(--gradient-end)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .an-stat-label { font-size: 12px; color: var(--text-tertiary); margin-top: 6px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; }
        .an-chart { background: var(--surface-card); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 16px 12px 8px; }
        .an-chart-bars { display: flex; align-items: flex-end; gap: 3px; height: 120px; }
        .an-chart-col { flex: 1; display: flex; align-items: flex-end; height: 100%; cursor: pointer; }
        .an-chart-bar { width: 100%; border-radius: 3px 3px 0 0; background: linear-gradient(to top, rgba(232,168,56,0.3), var(--primary)); transition: height 0.3s ease; min-height: 2px; }
        .an-chart-labels { display: flex; justify-content: space-between; margin-top: 8px; overflow-x: auto; gap: 2px; }
        .an-chart-label { font-size: 9px; color: var(--text-tertiary); font-weight: 500; white-space: nowrap; }
        .an-top-songs { background: var(--surface-card); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 8px 0; }
        .an-top-song { display: flex; align-items: center; gap: 10px; padding: 8px 14px; border-bottom: 1px solid var(--border); }
        .an-top-song:last-child { border-bottom: none; }
        .an-top-rank { width: 22px; text-align: center; font-size: 12px; font-weight: 700; color: var(--text-tertiary); flex-shrink: 0; }
        .an-top-info { flex: 1; min-width: 0; }
        .an-top-title { font-size: 13px; font-weight: 600; }
        .an-top-artist { font-size: 11px; color: var(--text-secondary); }
        .an-top-bar-wrapper { width: 80px; height: 6px; background: var(--surface-elevated); border-radius: 3px; overflow: hidden; flex-shrink: 0; }
        .an-top-bar { height: 100%; background: linear-gradient(90deg, var(--gradient-start), var(--gradient-end)); border-radius: 3px; transition: width 0.5s ease; }
        .an-top-plays { font-size: 12px; font-weight: 700; color: var(--text-secondary); flex-shrink: 0; font-variant-numeric: tabular-nums; }
        /* ========== WEBHOOKS SECTION ========== */
        .wh-content { padding: 16px; display: flex; flex-direction: column; gap: 14px; }
        .wh-events-grid { display: flex; flex-wrap: wrap; gap: 6px; }
        .wh-event-chip { display: flex; align-items: center; gap: 6px; cursor: pointer; }
        .wh-event-chip input { display: none; }
        .wh-event-label { padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 600; border: 1.5px solid var(--border); background: transparent; color: var(--text-secondary); cursor: pointer; transition: all 0.2s ease; }
        .wh-event-label:active { transform: scale(0.95); }
        .wh-event-label.checked { background: var(--primary); border-color: var(--primary); color: #fff; }
        .wh-list { display: flex; flex-direction: column; gap: 8px; }
        .wh-card { background: var(--surface-card); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 14px 16px; display: flex; flex-direction: column; gap: 10px; transition: all 0.2s ease; }
        .wh-card.disabled { opacity: 0.5; }
        .wh-card-top { display: flex; align-items: center; gap: 12px; }
        .wh-card-url { flex: 1; font-size: 13px; font-weight: 500; font-family: monospace; color: var(--text-secondary); word-break: break-all; }
        .wh-card-events { display: flex; flex-wrap: wrap; gap: 4px; }
        .wh-event-tag { padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 600; background: rgba(232,168,56,0.1); color: var(--primary); }
        .wh-card-actions { display: flex; gap: 8px; }
        .wh-test-btn { padding: 7px 14px; border-radius: var(--radius-sm); font-size: 12px; font-weight: 600; cursor: pointer; border: 1.5px solid var(--border); background: transparent; color: var(--text-secondary); display: flex; align-items: center; gap: 5px; transition: all 0.2s ease; }
        .wh-test-btn:active { background: var(--surface-elevated); }
        .wh-delete-btn { padding: 7px 14px; border-radius: var(--radius-sm); font-size: 12px; font-weight: 600; cursor: pointer; border: none; background: rgba(239,68,68,0.1); color: var(--error); display: flex; align-items: center; gap: 5px; transition: all 0.2s ease; }
        .wh-delete-btn:active { background: rgba(239,68,68,0.2); }
        .wh-secret-badge { display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--text-tertiary); padding-top: 6px; border-top: 1px solid var(--border); }
        /* ========== SETTINGS SECTION ========== */
        .st-content { padding: 16px; display: flex; flex-direction: column; gap: 18px; }
        .st-section { display: flex; flex-direction: column; gap: 8px; }
        .st-section-title { font-size: 13px; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; }
        .st-copy-row { display: flex; gap: 8px; align-items: center; }
        .st-copy-input { flex: 1; }
        .st-copy-btn { width: 44px; height: 44px; border-radius: var(--radius-md); border: 1.5px solid var(--border); background: var(--surface-card); color: var(--text-secondary); font-size: 18px; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all 0.2s ease; }
        .st-copy-btn:active { background: var(--surface-elevated); border-color: var(--primary); color: var(--primary); }
        .st-toggle-row { display: flex; align-items: center; gap: 16px; padding: 14px 16px; background: var(--surface-card); border: 1px solid var(--border); border-radius: var(--radius-lg); }
        .st-toggle-info { flex: 1; }
        .st-toggle-title { font-size: 14px; font-weight: 600; }
        .st-toggle-desc { font-size: 12px; color: var(--text-tertiary); margin-top: 2px; }
        .st-mount-list { display: flex; flex-direction: column; gap: 4px; }
        .st-mount-item { display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: var(--surface-elevated); border-radius: var(--radius-sm); }
        .st-mount-info { display: flex; align-items: center; gap: 10px; }
        .st-mount-path { font-size: 14px; font-weight: 500; font-family: monospace; }
        .st-mount-type { padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 600; text-transform: uppercase; }
        .st-mount-type.stream { background: rgba(59,130,246,0.1); color: #3B82F6; }
        .st-mount-type.live { background: rgba(239,68,68,0.1); color: var(--error); }
        .st-mount-type.mobile { background: rgba(139,92,246,0.1); color: #8B5CF6; }
        .st-mount-listeners { font-size: 12px; color: var(--text-tertiary); }
        .st-danger { background: rgba(239,68,68,0.04); border: 1px solid rgba(239,68,68,0.15); border-radius: var(--radius-lg); padding: 18px; display: flex; flex-direction: column; gap: 10px; }
        .st-danger-title { font-size: 16px; font-weight: 700; color: var(--error); }
        .st-danger p { font-size: 13px; color: var(--text-secondary); line-height: 1.5; }
        .st-danger-btn { padding: 12px 20px; border-radius: var(--radius-md); border: 1.5px solid rgba(239,68,68,0.3); background: transparent; color: var(--error); font-size: 14px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: all 0.2s ease; align-self: flex-start; }
        .st-danger-btn:active { background: rgba(239,68,68,0.1); }
        .st-loading { text-align: center; padding: 40px 0; color: var(--text-tertiary); }
        .st-error-banner { background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2); border-radius: var(--radius-md); padding: 10px 14px; font-size: 13px; color: var(--error); display: flex; align-items: center; gap: 8px; }
        .st-success-banner { background: rgba(34,197,94,0.08); border: 1px solid rgba(34,197,94,0.2); border-radius: var(--radius-md); padding: 10px 14px; font-size: 13px; color: var(--success); display: flex; align-items: center; gap: 8px; }
        .st-mount-empty { padding: 16px 0; font-size: 13px; color: var(--text-tertiary); text-align: center; }
        .st-save-btn { padding: 12px 24px; border-radius: var(--radius-md); border: none; background: var(--primary); color: white; font-size: 14px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: all 0.2s ease; align-self: flex-start; }
        .st-save-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .st-save-btn:active:not(:disabled) { opacity: 0.9; }

        /* ========== NEW PLAYLISTS SECTION ========== */
        .pl-content-new { padding: 16px; display: flex; flex-direction: column; gap: 14px; }
        .pl-new-header { display: flex; align-items: center; justify-content: space-between; }
        .pl-new-heading { font-size: 22px; font-weight: 800; }
        .pl-filter-tabs { display: flex; gap: 6px; align-items: center; overflow-x: auto; -webkit-overflow-scrolling: touch; }
        .pl-filter-tabs::-webkit-scrollbar { display: none; }
        .pl-filter-tab { display: flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 8px; font-size: 13px; font-weight: 600; border: none; background: transparent; color: var(--text-secondary); cursor: pointer; white-space: nowrap; transition: all 0.2s ease; }
        .pl-filter-tab:active { transform: scale(0.95); }
        .pl-filter-tab.active { background: var(--surface-card); border: 1px solid var(--border); color: var(--text-primary); }
        .pl-filter-count { padding: 1px 7px; border-radius: 8px; font-size: 11px; font-weight: 700; background: var(--surface-elevated); color: var(--text-tertiary); }
        .pl-two-panel { display: flex; gap: 14px; min-height: 400px; }
        .pl-left-panel { flex: 1; min-width: 0; }
        .pl-left-compact { max-width: 400px; }
        .pl-right-panel { flex: 1; min-width: 0; background: var(--surface-card); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 18px; display: flex; flex-direction: column; gap: 18px; align-self: flex-start; }
        .pl-card-list { display: flex; flex-direction: column; gap: 6px; }
        .pl-card-new { display: flex; align-items: flex-start; gap: 10px; padding: 12px 14px; background: var(--surface-card); border: 1px solid var(--border); border-radius: var(--radius-lg); cursor: pointer; transition: all 0.2s ease; position: relative; }
        .pl-card-new:active { transform: scale(0.98); }
        .pl-card-new.selected { border-color: var(--primary); border-left: 3px solid var(--primary); padding-left: 12px; }
        .pl-card-new.now-playing { border-left: 3px solid var(--success); padding-left: 12px; }
        .pl-card-new.default { background: rgba(232,168,56,0.03); }
        .pl-card-status-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; margin-top: 5px; }
        .pl-card-status-dot.active { background: var(--success); box-shadow: 0 0 6px var(--success); animation: livePulse 1.5s ease-in-out infinite; }
        .pl-card-status-dot.scheduled { background: var(--primary); }
        .pl-card-status-dot.general { background: var(--text-tertiary); }
        .pl-card-status-dot.disabled { background: var(--error); opacity: 0.5; }
        .pl-card-new-body { flex: 1; min-width: 0; }
        .pl-card-new-top { display: flex; align-items: center; gap: 8px; }
        .pl-card-new-name { font-size: 15px; font-weight: 600; flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .pl-card-new-meta { font-size: 12px; color: var(--text-tertiary); margin-top: 3px; }
        .pl-card-new-tag { display: inline-flex; align-items: center; gap: 4px; margin-top: 6px; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; background: rgba(232,168,56,0.08); color: var(--primary); }
        .pl-card-new-actions { display: flex; align-items: center; gap: 4px; flex-shrink: 0; }
        .pl-card-edit-btn { width: 30px; height: 30px; border-radius: 50%; background: none; border: none; color: var(--text-tertiary); font-size: 13px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
        .pl-card-edit-btn:active { background: var(--surface-elevated); color: var(--text-primary); }
        .pl-card-menu-wrapper { position: relative; }
        .pl-card-menu-btn { width: 30px; height: 30px; border-radius: 50%; background: none; border: none; color: var(--text-tertiary); font-size: 16px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
        .pl-card-menu-btn:active { background: var(--surface-elevated); }
        .pl-menu-overlay { position: fixed; inset: 0; z-index: 100; }
        .pl-menu-dropdown { position: absolute; top: 100%; right: 0; margin-top: 4px; background: var(--surface-card); border: 1px solid var(--border); border-radius: var(--radius-md); box-shadow: var(--shadow-lg); z-index: 101; min-width: 140px; overflow: hidden; }
        .pl-menu-item { display: flex; align-items: center; gap: 8px; width: 100%; padding: 10px 14px; font-size: 13px; font-weight: 500; border: none; background: none; color: var(--text-primary); cursor: pointer; text-align: left; }
        .pl-menu-item:active { background: var(--surface-hover); }
        .pl-menu-item.danger { color: var(--error); }
        .pl-card-now-playing-badge { position: absolute; top: -1px; right: -1px; padding: 2px 8px; font-size: 10px; font-weight: 700; background: var(--success); color: #fff; border-radius: 0 var(--radius-lg) 0 6px; }
        .pl-detail-header { display: flex; align-items: center; gap: 10px; }
        .pl-detail-back { width: 32px; height: 32px; border-radius: 50%; border: none; background: var(--surface-elevated); color: var(--text-secondary); font-size: 14px; cursor: pointer; display: none; align-items: center; justify-content: center; }
        .pl-detail-back:active { transform: scale(0.92); }
        .pl-detail-header-info { flex: 1; display: flex; align-items: center; gap: 8px; }
        .pl-detail-name { font-size: 20px; font-weight: 700; }
        .pl-detail-header-actions { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
        .pl-detail-edit-btn { display: flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: var(--radius-sm); font-size: 12px; font-weight: 600; border: 1px solid var(--border); background: transparent; color: var(--text-secondary); cursor: pointer; }
        .pl-detail-edit-btn:active { background: var(--surface-elevated); }
        .pl-detail-schedule { background: rgba(232,168,56,0.04); border: 1px solid rgba(232,168,56,0.1); border-radius: var(--radius-md); padding: 14px; display: flex; flex-direction: column; gap: 10px; }
        .pl-detail-section-title { font-size: 13px; font-weight: 600; color: var(--text-secondary); display: flex; align-items: center; gap: 6px; }
        .pl-detail-schedule-body { display: flex; flex-direction: column; gap: 8px; }
        .pl-detail-days { display: flex; gap: 4px; flex-wrap: wrap; }
        .pl-detail-day-pill { padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 600; background: var(--surface-elevated); color: var(--text-tertiary); }
        .pl-detail-day-pill.active { background: var(--primary); color: #fff; }
        .pl-detail-time { font-size: 14px; font-weight: 700; color: var(--text-primary); }
        .pl-detail-next-run { font-size: 12px; color: var(--text-tertiary); display: flex; align-items: center; gap: 6px; }
        .pl-detail-songs { display: flex; flex-direction: column; gap: 10px; }
        .pl-detail-songs-header { display: flex; align-items: center; justify-content: space-between; }
        .pl-detail-add-songs-btn { display: flex; align-items: center; gap: 4px; padding: 8px 14px; border-radius: var(--radius-sm); font-size: 12px; font-weight: 600; border: 1.5px dashed var(--border); background: transparent; color: var(--primary); cursor: pointer; }
        .pl-detail-add-songs-btn:active { border-color: var(--primary); background: rgba(232,168,56,0.03); }
        .pl-detail-empty-songs { text-align: center; padding: 30px 0; color: var(--text-tertiary); }
        .pl-detail-empty-songs i { font-size: 32px; opacity: 0.4; margin-bottom: 8px; display: block; }
        .pl-detail-empty-songs p { font-size: 15px; font-weight: 600; margin: 0 0 4px; }
        .pl-detail-empty-songs span { font-size: 13px; }
        .pl-detail-song-list { display: flex; flex-direction: column; gap: 4px; }
        .pl-detail-song-item { display: flex; align-items: center; gap: 8px; padding: 6px 8px; border-radius: var(--radius-sm); transition: background 0.15s ease; }
        .pl-detail-song-item:active { background: var(--surface-hover); }
        .pl-detail-song-drag { color: var(--text-tertiary); font-size: 14px; cursor: grab; flex-shrink: 0; }
        .pl-detail-song-cover { width: 36px; height: 36px; border-radius: 6px; object-fit: cover; flex-shrink: 0; border: 1px solid var(--border); }
        .pl-detail-song-info { flex: 1; min-width: 0; }
        .pl-detail-song-title { font-size: 14px; font-weight: 600; }
        .pl-detail-song-artist { font-size: 12px; color: var(--text-secondary); }
        .pl-detail-song-duration { font-size: 12px; color: var(--text-tertiary); font-weight: 500; flex-shrink: 0; }
        .pl-detail-song-remove { width: 26px; height: 26px; border-radius: 50%; border: none; background: none; color: var(--text-tertiary); font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; opacity: 0; transition: all 0.2s ease; }
        .pl-detail-song-item:hover .pl-detail-song-remove { opacity: 1; }
        .pl-detail-song-remove:active { background: rgba(239,68,68,0.1); color: var(--error); }
        .pl-detail-total-duration { font-size: 12px; font-weight: 600; color: var(--text-tertiary); padding: 8px 8px 0; border-top: 1px solid var(--border); margin-top: 4px; }
        .pl-sched-view-toggle { display: flex; align-items: center; gap: 8px; }
        .pl-sched-toggle-btn { display: flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 8px; font-size: 13px; font-weight: 600; border: 1.5px solid var(--border); background: var(--surface-card); color: var(--text-secondary); cursor: pointer; transition: all 0.2s ease; }
        .pl-sched-toggle-btn:active { transform: scale(0.95); }
        .pl-sched-toggle-btn.active { border-color: var(--primary); color: var(--primary); }
        .pl-schedule-view { display: flex; flex-direction: column; gap: 10px; }
        .pl-sv-header { display: flex; align-items: center; justify-content: space-between; }
        .pl-sv-title { font-size: 16px; font-weight: 700; }
        .pl-sv-grid-wrapper { overflow-x: auto; -webkit-overflow-scrolling: touch; }
        .pl-sv-grid-wrapper::-webkit-scrollbar { display: none; }
        .pl-sv-grid { display: grid; grid-template-columns: 50px repeat(7, 1fr); gap: 1px; background: var(--border); border: 1px solid var(--border); border-radius: var(--radius-md); overflow: hidden; min-width: 600px; }
        .pl-sv-corner { background: var(--surface-card); }
        .pl-sv-day-header { background: var(--surface-card); padding: 8px 4px; text-align: center; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-secondary); }
        .pl-sv-day-header.today { background: rgba(232,168,56,0.1); color: var(--primary); }
        .pl-sv-time { background: var(--surface-card); padding: 2px 6px; font-size: 9px; color: var(--text-tertiary); font-weight: 500; text-align: right; display: flex; align-items: flex-start; justify-content: flex-end; }
        .pl-sv-cell { background: var(--surface-elevated); min-height: 24px; padding: 1px; position: relative; cursor: default; }
        .pl-sv-cell.today { background: rgba(232,168,56,0.03); }
        .pl-sv-cell.has-block { padding: 1px; }
        .pl-sv-block { border-radius: 3px; padding: 1px 4px; font-size: 8px; font-weight: 700; color: #fff; margin-bottom: 1px; cursor: pointer; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; line-height: 1.4; }
        .pl-sv-block:active { opacity: 0.8; }
        .pl-empty-state { text-align: center; padding: 50px 20px; color: var(--text-tertiary); }
        .pl-empty-state i { font-size: 40px; opacity: 0.3; margin-bottom: 12px; display: block; }
        .pl-empty-state h4 { font-size: 16px; font-weight: 700; margin: 0 0 6px; color: var(--text-primary); }
        .pl-empty-state p { font-size: 13px; margin: 0 0 16px; }
        .pl-type-options { display: flex; flex-direction: column; gap: 6px; }
        .pl-type-option { display: flex; flex-direction: column; gap: 2px; padding: 12px 14px; border: 1.5px solid var(--border); border-radius: var(--radius-md); cursor: pointer; transition: all 0.2s ease; }
        .pl-type-option:active { transform: scale(0.98); }
        .pl-type-option.active { border-color: var(--primary); background: rgba(232,168,56,0.03); }
        .pl-type-option input { display: none; }
        .pl-type-option-label { font-size: 14px; font-weight: 600; }
        .pl-type-option-desc { font-size: 12px; color: var(--text-tertiary); }
        .pl-order-options { display: flex; gap: 8px; }
        .pl-order-option { display: flex; align-items: center; gap: 6px; padding: 10px 16px; border: 1.5px solid var(--border); border-radius: var(--radius-md); cursor: pointer; font-size: 13px; font-weight: 600; transition: all 0.2s ease; }
        .pl-order-option:active { transform: scale(0.95); }
        .pl-order-option.active { border-color: var(--primary); background: rgba(232,168,56,0.03); }
        .pl-order-option input { display: none; }
        .pl-form-danger { padding: 10px 20px; background: rgba(239,68,68,0.1); border: none; border-radius: var(--radius-sm); color: var(--error); font-size: 13px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: all 0.2s ease; }
        .pl-form-danger:active { background: rgba(239,68,68,0.2); }
        .pl-form-danger:disabled { opacity: 0.5; cursor: not-allowed; }
        .media-modal-close { width: 32px; height: 32px; border-radius: 50%; border: none; background: var(--surface-elevated); color: var(--text-secondary); font-size: 16px; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .media-modal-close:active { background: var(--surface-hover); }
        .pl-picker-checkbox { width: 20px; height: 20px; border-radius: 4px; border: 2px solid var(--border); display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 11px; color: #fff; background: transparent; }
        .pl-picker-checkbox.checked { background: var(--primary); border-color: var(--primary); }
        .pl-picker-already { font-size: 11px; color: var(--text-tertiary); font-weight: 500; flex-shrink: 0; }
        .pl-picker-footer { display: flex; align-items: center; justify-content: space-between; padding: 12px 20px; border-top: 1px solid var(--border); }
        .pl-picker-count { font-size: 13px; font-weight: 600; color: var(--text-secondary); }
        @media (max-width: 640px) {
          .pl-two-panel { flex-direction: column; }
          .pl-left-compact { max-width: 100%; }
          .pl-detail-back { display: flex; }
          .pl-right-panel { margin-left: 0; }
          .pl-filter-tab { font-size: 12px; padding: 6px 10px; }
        }
      
          /* ========== SKELETON LOADERS ========== */
          .skeleton-loading { background: linear-gradient(90deg, var(--surface) 25%, var(--surface-hover) 50%, var(--surface) 75%); background-size: 200% 100%; animation: shimmer 1.5s ease-in-out infinite; border-radius: var(--radius-md); }
          .skeleton-line { height: 14px; width: 100%; margin-bottom: 8px; }
          .skeleton-line.w60 { width: 60%; }
          .skeleton-line.w40 { width: 40%; }
          .skeleton-line.w80 { width: 80%; }
          .skeleton-line.w30 { width: 30%; }
          .skeleton-line.h24 { height: 24px; }
          .skeleton-line.h40 { height: 40px; }
          .skeleton-line.h100 { height: 100px; }
          .skeleton-block { background: var(--surface-card); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 16px; }
          .skeleton-img { background: linear-gradient(90deg, var(--surface) 25%, var(--surface-hover) 50%, var(--surface) 75%); background-size: 200% 100%; animation: shimmer 1.5s ease-in-out infinite; border-radius: var(--radius-md); }
          .skeleton-card { background: var(--surface-card); border: 1px solid var(--border); border-radius: var(--radius-lg); overflow: hidden; }
          @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

          
          /* ========== SKELETON LOADERS ========== */
          .skeleton-loading { background: linear-gradient(90deg, var(--surface) 25%, var(--surface-hover) 50%, var(--surface) 75%); background-size: 200% 100%; animation: shimmer 1.5s ease-in-out infinite; border-radius: var(--radius-md); }
          .skeleton-line { height: 14px; width: 100%; margin-bottom: 8px; }
          .skeleton-line.w60 { width: 60%; }
          .skeleton-line.w40 { width: 40%; }
          .skeleton-line.w80 { width: 80%; }
          .skeleton-line.w30 { width: 30%; }
          .skeleton-line.h24 { height: 24px; }
          .skeleton-line.h40 { height: 40px; }
          .skeleton-line.h100 { height: 100px; }
          .skeleton-block { background: var(--surface-card); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 16px; }
          .skeleton-img { background: linear-gradient(90deg, var(--surface) 25%, var(--surface-hover) 50%, var(--surface) 75%); background-size: 200% 100%; animation: shimmer 1.5s ease-in-out infinite; border-radius: var(--radius-md); }
          .skeleton-card { background: var(--surface-card); border: 1px solid var(--border); border-radius: var(--radius-lg); overflow: hidden; }
          @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

          `}</style>

      <ToastBridge />

      <div className="app-container">
        <div className="status-bar"></div>

        {/* ========== RADIO HEADER ========== */}
        <header className="radio-header">
          <div className="radio-header-logo"><i className="fas fa-tower-broadcast"></i></div>
          <div className="radio-header-info">
            <div className="radio-header-name">Kingdom Seekers Radio</div>
            <div className="radio-header-sub">FaithStream Radio Station</div>
          </div>
          <div className="radio-header-right">
            <div className={`on-air-badge ${isLive ? "live" : "off"}`}>
              <span className={`on-air-dot ${isLive ? "live" : "off"}`}></span>
              {isLive ? "On Air" : "Off Air"}
            </div>
            <div className="listener-count">
              <i className="fas fa-headphones"></i>
              {listeners}
            </div>
          </div>
        </header>

        {/* ========== NOW PLAYING BAR ========== */}
        <div className="now-playing-bar">
          <div className="npb-thumb">
            <img src="https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=60&h=60&fit=crop" alt="Art" />
          </div>
          <div className="npb-info">
            <div className="npb-title">Amazing Grace (My Chains Are Gone)</div>
            <div className="npb-artist">Chris Tomlin</div>
          </div>
          <button
            className="npb-player-btn"              onClick={() => {
              const newPlaying = !isPlaying;
              setIsPlaying(newPlaying);
              window.dispatchEvent(
                new CustomEvent("show-toast", {
                  detail: { title: newPlaying ? "Playing" : "Paused", message: `Stream ${newPlaying ? "resumed" : "paused"}`, type: "info", duration: 2000 },
                })
              );
            }}
          >
            <i className={`fas ${isPlaying ? "fa-pause" : "fa-play"}`}></i>
          </button>
        </div>

        {/* ========== TAB BAR ========== */}
        <nav className="tab-bar">
          {sidebarTabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <i className={`fas ${tab.icon}`}></i>
              {tab.label}
            </button>
          ))}
        </nav>

        {/* ========== MAIN CONTENT ========== */}
        <div className="content-scroll" id="contentScroll">
          {renderContent()}
          <div style={{ height: "40px" }}></div>
        </div>

        {/* ========== BOTTOM NAV ========== */}
        <AdminBottomNav />
      </div>
    </>
  );
}
