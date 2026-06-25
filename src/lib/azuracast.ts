"use client";

// ============================================================
// AZURACAST API CLIENT
// ============================================================

const STATION_ID = "1";

export function getApiBase(): string {
  if (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_AZURACAST_URL)
    return process.env.NEXT_PUBLIC_AZURACAST_URL;
  return "https://azuracast.histoview.co.ke";
}

export function getApiKey(): string {
  if (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_AZURACAST_API_KEY)
    return process.env.NEXT_PUBLIC_AZURACAST_API_KEY;
  return "";
}

async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<{ ok: boolean; status: number; data?: T }> {
  const base = getApiBase();
  const key = getApiKey();
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options?.headers as Record<string, string>),
    };
    if (key) headers["Authorization"] = `Bearer ${key}`;

    const res = await fetch(`${base}/api${endpoint}`, {
      ...options,
      headers,
      cache: "no-store",
    });
    if (!res.ok) return { ok: false, status: res.status };
    const data = await res.json();
    return { ok: true, status: res.status, data };
  } catch (err) {
    console.warn(`[AzuraCast] ${endpoint} failed:`, err);
    return { ok: false, status: 0 };
  }
}

// ============================================================
// TYPES
// ============================================================

export interface NowPlayingData {
  station: { name: string; shortName: string; isLive: boolean; listenUrl: string };
  nowPlaying: {
    song: { title: string; artist: string; albumArt: string };
    duration: number;
    elapsed: number;
    playlist: string;
  } | null;
  listeners: { current: number; unique: number; total: number };
  live: { isLive: boolean; streamerName: string | null };
  songHistory: SongHistoryItem[];
}

export interface SongHistoryItem {
  song: { title: string; artist: string; albumArt: string };
  playedAt: string;
  duration: number;
}

export interface StationFile {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: string;
  genre: string;
  path: string;
  size: string;
  albumArt: string;
  playlists: string[];
}

export interface Playlist {
  id: string;
  name: string;
  type: "standard" | "scheduled" | "on_demand";
  order: "shuffle" | "sequential";
  weight: number;
  enabled: boolean;
  songCount: number;
  songs: string[];
  schedule?: {
    days: number[];
    startTime: string;
    endTime: string;
  };
}

export interface Streamer {
  id: string;
  displayName: string;
  username: string;
  isLive: boolean;
  lastBroadcast: string | null;
  broadcastHistory: { date: string; duration: string; startTime: string }[];
}

export interface Webhook {
  id: string;
  name?: string;
  url: string;
  events: string[];
  enabled: boolean;
  secret: string;
}

export interface AnalyticsReport {
  totalListeners: { today: number; week: number; month: number };
  peakConcurrent: number;
  listenersOverTime: { time: string; count: number }[];
  topSongs: { title: string; artist: string; plays: number }[];
  broadcastHistory: { date: string; dj: string; duration: string }[];
}

export interface StationSettings {
  name: string;
  streamUrl: string;
  publicPageUrl: string;
  autoDJ: boolean;
  maxListeners: number;
  defaultBitrate: number;
  publicPageVisible: boolean;
  mountPoint: string;
}

export interface StationStatus {
  backendRunning: boolean;
  frontendRunning: boolean;
}

export interface QueueItem {
  song: { title: string; artist: string; albumArt: string };
  cuedAt: number;
  playlist: string;
  isRequest: boolean;
}

export interface Station {
  id: number;
  name: string;
  shortcode: string;
  description: string;
  listen_url: string;
  url: string | null;
  public_player_url: string;
  is_public: boolean;
  mounts: Array<{
    id: number;
    name: string;
    url: string;
    bitrate: number;
    format: string;
    listeners: { current: number; unique: number; total: number };
    path: string;
    is_default: boolean;
  }>;
}

// ============================================================
// MOCK DATA (fallbacks)
// ============================================================

const FALLBACK_NOW_PLAYING: NowPlayingData = {
  station: { name: "Kingdom Seekers Radio", shortName: "grace_community", isLive: false, listenUrl: "" },
  nowPlaying: null,
  listeners: { current: 0, unique: 0, total: 0 },
  live: { isLive: false, streamerName: null },
  songHistory: [],
};

const FALLBACK_STREAMERS: Streamer[] = [];

// ============================================================
// LEGACY MOCK EXPORTS (used by radio-station section components)
// ============================================================

export const MOCK_FILES: StationFile[] = [];
export const MOCK_PLAYLISTS: Playlist[] = [];
export const MOCK_STREAMERS: Streamer[] = [];
export const MOCK_WEBHOOKS: Webhook[] = [];

const FALLBACK_SETTINGS: StationSettings = {
  name: "Kingdom Seekers Radio",
  streamUrl: "https://azuracast.histoview.co.ke/radio/8000/kingdom_seekers.mp3",
  publicPageUrl: "https://faithstream.app/radio/grace",
  autoDJ: true,
  maxListeners: 500,
  defaultBitrate: 128,
  publicPageVisible: true,
  mountPoint: "/grace_live",
};

// ============================================================
// API FUNCTIONS
// ============================================================

function mapNowPlaying(raw: any): NowPlayingData {
  const rawListenUrl = raw.station?.listen_url || "";
  return {
    station: {
      name: raw.station?.name || FALLBACK_NOW_PLAYING.station.name,
      shortName: raw.station?.shortcode || FALLBACK_NOW_PLAYING.station.shortName,
      isLive: raw.station?.is_streamer_live ?? false,
      listenUrl: rawListenUrl.replace(/^http:\/\//i, "https://"),
    },
    nowPlaying: raw.now_playing?.song
      ? {
          song: {
            title: raw.now_playing.song.title || "",
            artist: raw.now_playing.song.artist || "",
            albumArt: raw.now_playing.song.art || "",
          },
          duration: raw.now_playing.duration || 0,
          elapsed: raw.now_playing.elapsed || 0,
          playlist: raw.now_playing.playlist || "",
        }
      : null,
    listeners: {
      current: raw.listeners?.current ?? 0,
      unique: raw.listeners?.unique ?? 0,
      total: raw.listeners?.total ?? 0,
    },
    live: {
      isLive: raw.live?.is_live ?? false,
      streamerName: raw.live?.streamer_name || null,
    },
    songHistory: (raw.song_history || []).map((h: any) => ({
      song: {
        title: h.song?.title || "",
        artist: h.song?.artist || "",
        albumArt: h.song?.art || "",
      },
      playedAt: h.played_at
        ? new Date(h.played_at * 1000).toISOString()
        : "",
      duration: h.duration || 0,
    })),
  };
}

function mapStreamer(raw: any): Streamer {
  return {
    id: String(raw.id || ""),
    displayName: raw.display_name || raw.streamer_name || raw.username || "Unknown",
    username: raw.streamer_username || raw.username || "",
    isLive: raw.is_active ?? raw.is_online ?? false,
    lastBroadcast: raw.last_broadcast || null,
    broadcastHistory: [],
  };
}

export async function getNowPlaying(
  stationId: string
): Promise<NowPlayingData> {
  const result = await apiFetch<any>(`/nowplaying/${stationId}`);
  if (result.ok && result.data) {
    return mapNowPlaying(result.data);
  }
  return FALLBACK_NOW_PLAYING;
}

export async function getStations(): Promise<Station[]> {
  const result = await apiFetch<Station[]>("/stations");
  if (result.ok && Array.isArray(result.data)) return result.data;
  return [];
}

export function getStationEmbedUrl(station: Station): string {
  const base = (station.public_player_url || `https://azuracast.histoview.co.ke/public/${station.shortcode}`).replace(/^http:\/\//i, "https://");
  return `${base}/embed`;
}

export async function getQueue(): Promise<QueueItem[]> {
  const result = await apiFetch<any[]>(`/station/${STATION_ID}/queue`);
  if (result.ok && Array.isArray(result.data)) {
    return result.data.map((item: any) => ({
      song: {
        title: item.song?.title || "",
        artist: item.song?.artist || "",
        albumArt: item.song?.art || "",
      },
      cuedAt: item.cued_at || 0,
      playlist: item.playlist || "",
      isRequest: item.is_request || false,
    }));
  }
  return [];
}

function mapStationStatus(raw: any): StationStatus {
  return {
    backendRunning: raw.backend_running ?? raw.backendRunning ?? false,
    frontendRunning: raw.frontend_running ?? raw.frontendRunning ?? false,
  };
}

export async function getStationStatus(
  stationId: string
): Promise<StationStatus> {
  const result = await apiFetch<any>(
    `/station/${stationId}/status`
  );
  if (result.ok && result.data) {
    return mapStationStatus(result.data);
  }
  return { backendRunning: false, frontendRunning: false };
}

export async function toggleStationLive(): Promise<{ isLive: boolean }> {
  const status = await getStationStatus(STATION_ID);
  const action = status.backendRunning ? "off" : "on";
  const result = await apiFetch<any>(
    `/station/${STATION_ID}/backend`,
    {
      method: "POST",
      body: JSON.stringify({ action }),
    }
  );
  if (result.ok) {
    return { isLive: action === "on" };
  }
  return { isLive: status.backendRunning };
}

let _savedEnabledPlaylistIds: string[] | null = null;

export async function toggleAutoDJ(): Promise<{ running: boolean }> {
  // Try backend endpoint first (may not work on all AzuraCast versions)
  const status = await getStationStatus(STATION_ID);
  const isRunning = status.backendRunning;
  const action = isRunning ? "off" : "on";
  const result = await apiFetch<any>(
    `/station/${STATION_ID}/backend`,
    {
      method: "POST",
      body: JSON.stringify({ action }),
    }
  );
  if (result.ok) {
    return { running: action === "on" };
  }

  // Fallback: toggle playlists on/off (backend endpoint returned 405 or similar)
  const plResult = await apiFetch<any[]>(`/station/${STATION_ID}/playlists`);
  if (!plResult.ok || !Array.isArray(plResult.data)) {
    return { running: isRunning };
  }

  if (isRunning) {
    // PAUSE: save which playlists are enabled, then disable all
    _savedEnabledPlaylistIds = plResult.data
      .filter((p: any) => p.is_enabled)
      .map((p: any) => String(p.id));
    for (const id of _savedEnabledPlaylistIds) {
      await apiFetch(`/station/${STATION_ID}/playlist/${id}/toggle`, { method: "PUT" }).catch(() => {});
    }
    return { running: false };
  } else {
    // RESUME: restore previously-enabled playlists
    const idsToRestore = _savedEnabledPlaylistIds || plResult.data.map((p: any) => String(p.id));
    _savedEnabledPlaylistIds = null;
    for (const id of idsToRestore) {
      await apiFetch(`/station/${STATION_ID}/playlist/${id}/toggle`, { method: "PUT" }).catch(() => {});
    }
    return { running: true };
  }
}

function mapStationFile(raw: any): StationFile {
  const media = raw.media || raw;
  return {
    id: String(media.id || ""),
    title: media.title || "",
    artist: media.artist || "",
    album: media.album || "",
    duration: media.length_text || "0:00",
    genre: media.genre || "",
    path: media.path || raw.path || "",
    size: "",
    albumArt: media.art || "",
    playlists: (media.playlists || []).map((p: any) => String(p.id)),
  };
}

function mapPlaylist(raw: any): Playlist {
  let schedule: Playlist["schedule"];
  if (raw.schedule_items?.length > 0) {
    const days = [...new Set(
      (raw.schedule_items.flatMap((s: any) => s.days ?? []) as number[]).map(Number)
    )];
    schedule = {
      days,
      startTime: raw.schedule_items[0]?.start_time != null
        ? `${String(raw.schedule_items[0].start_time).padStart(2, "0")}:00`
        : "09:00",
      endTime: raw.schedule_items[0]?.end_time != null
        ? `${String(raw.schedule_items[0].end_time).padStart(2, "0")}:00`
        : "17:00",
    };
  }
  return {
    id: String(raw.id),
    name: raw.name || "",
    type: raw.type === "scheduled" ? "scheduled" : (raw.type === "on_demand" || raw.type === "ondemand") ? "on_demand" : "standard",
    order: raw.order === "sequential" ? "sequential" : "shuffle",
    weight: raw.weight ?? 10,
    enabled: raw.is_enabled ?? true,
    songCount: raw.num_songs ?? 0,
    songs: [],
    schedule,
  };
}

export async function getStationFiles(): Promise<StationFile[]> {
  const result = await apiFetch<any[]>(`/station/${STATION_ID}/files`);
  if (result.ok && Array.isArray(result.data)) {
    return result.data.map(mapStationFile);
  }
  return [];
}

export async function deleteStationFiles(filePaths: string[]): Promise<void> {
  if (filePaths.length === 0) return;
  await apiFetch(`/station/${STATION_ID}/files/batch`, {
    method: "PUT",
    body: JSON.stringify({ do: "delete", files: filePaths }),
  });
}

export async function deleteFile(fileId: string): Promise<void> {
  await apiFetch(`/station/${STATION_ID}/file/${fileId}`, {
    method: "DELETE",
  });
}

export async function updateFileMetadata(
  fileId: string,
  data: Record<string, any>
): Promise<void> {
  await apiFetch(`/station/${STATION_ID}/file/${fileId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function uploadFile(
  file: File,
  directory?: string
): Promise<StationFile | null> {
  const base = getApiBase();
  const key = getApiKey();
  const formData = new FormData();
  formData.append("path", directory || "/");
  formData.append("file", file);
  try {
    const res = await fetch(`${base}/api/station/${STATION_ID}/files/upload`, {
      method: "POST",
      headers: key ? { Authorization: `Bearer ${key}` } : {},
      body: formData,
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.success) {
        const files = await getStationFiles();
        return files[files.length - 1] || null;
      }
    }
    return null;
  } catch {
    return null;
  }
}

export async function getPlaylists(): Promise<Playlist[]> {
  const result = await apiFetch<any[]>(`/station/${STATION_ID}/playlists`);
  if (result.ok && Array.isArray(result.data)) {
    return result.data.map(mapPlaylist);
  }
  return [];
}

export async function getStationPlaylists(stationId: string): Promise<Playlist[]> {
  const result = await apiFetch<any[]>(`/station/${stationId}/playlists`);
  if (result.ok && Array.isArray(result.data)) {
    return result.data.map(mapPlaylist);
  }
  return [];
}

export async function getPlaylistSongs(playlistId: string): Promise<StationFile[]> {
  const result = await apiFetch<any[]>(
    `/station/${STATION_ID}/files/list?searchPhrase=playlist:${playlistId}`
  );
  if (result.ok && Array.isArray(result.data)) {
    return result.data.map(mapStationFile);
  }
  return [];
}

export async function createPlaylist(
  data: Partial<Playlist>
): Promise<Playlist> {
  const mappedType = data.type === "standard" ? "default" : (data.type || "default");
  const body: Record<string, any> = {
    name: data.name || "New Playlist",
    type: mappedType,
    source: "songs",
    order: data.order || "shuffle",
    weight: data.weight ?? 10,
  };
  const result = await apiFetch<any>(`/station/${STATION_ID}/playlists`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (!result.ok || !result.data) {
    throw new Error("Failed to create playlist");
  }
  if (data.type === "scheduled" && data.schedule && data.schedule.days.length > 0) {
    const dayValues = data.schedule.days.map((d) => parseInt(String(d)));
    if (dayValues.length === 1 && dayValues[0] === 0) {
      dayValues.push(0);
    }
    const updateResult = await apiFetch<any>(
      `/station/${STATION_ID}/playlist/${result.data.id}`,
      {
        method: "PUT",
        body: JSON.stringify({
          schedule_items: [{
            days: dayValues,
            start_time: parseInt(data.schedule.startTime),
            end_time: parseInt(data.schedule.endTime),
          }],
        }),
      }
    );
    if (updateResult.ok && updateResult.data) {
      return mapPlaylist(updateResult.data);
    }
  }
  return mapPlaylist(result.data);
}

export async function togglePlaylistEnabled(id: string): Promise<Playlist> {
  const result = await apiFetch<any>(
    `/station/${STATION_ID}/playlist/${id}/toggle`,
    { method: "PUT" }
  );
  if (!result.ok) {
    throw new Error("Failed to toggle playlist");
  }
  const refreshed = await apiFetch<any>(
    `/station/${STATION_ID}/playlist/${id}`
  );
  if (refreshed.ok && refreshed.data) {
    return mapPlaylist(refreshed.data);
  }
  throw new Error("Failed to fetch playlist after toggle");
}

export async function updatePlaylist(
  id: string,
  data: Partial<Playlist>
): Promise<Playlist> {
  const body: Record<string, any> = {};
  if (data.name !== undefined) body.name = data.name;
  if (data.order !== undefined) body.order = data.order;
  if (data.weight !== undefined) body.weight = data.weight;
  if (data.enabled !== undefined) body.is_enabled = data.enabled;
  if (data.type !== undefined) body.type = data.type === "standard" ? "default" : data.type;
  if (data.schedule !== undefined) {
    const dayValues = data.schedule.days.map((d) => parseInt(String(d)));
    if (dayValues.length === 1 && dayValues[0] === 0) {
      dayValues.push(0);
    }
    body.schedule_items = dayValues.length > 0
      ? [{
          days: dayValues,
          start_time: parseInt(data.schedule.startTime),
          end_time: parseInt(data.schedule.endTime),
        }]
      : [];
  }
  const result = await apiFetch<any>(
    `/station/${STATION_ID}/playlist/${id}`,
    { method: "PUT", body: JSON.stringify(body) }
  );
  if (result.ok && result.data) {
    return mapPlaylist(result.data);
  }
  throw new Error("Failed to update playlist");
}

export async function deletePlaylist(id: string): Promise<void> {
  await apiFetch(`/station/${STATION_ID}/playlist/${id}`, {
    method: "DELETE",
  });
}

export async function addSongsToPlaylist(
  playlistId: string,
  songIds: string[]
): Promise<void> {
  const plId = parseInt(playlistId);
  for (const songId of songIds) {
    const fileResult = await apiFetch<any>(
      `/station/${STATION_ID}/file/${songId}`
    );
    if (!fileResult.ok || !fileResult.data) continue;

    const currentIds = (fileResult.data.playlists || []).map((p: any) => p.id);
    if (!currentIds.includes(plId)) {
      currentIds.push(plId);
    }

    await apiFetch(`/station/${STATION_ID}/file/${songId}`, {
      method: "PUT",
      body: JSON.stringify({ playlists: currentIds }),
    });
  }
}

export async function removeSongFromPlaylist(
  playlistId: string,
  songId: string
): Promise<void> {
  const fileResult = await apiFetch<any>(
    `/station/${STATION_ID}/file/${songId}`
  );
  if (!fileResult.ok || !fileResult.data) return;

  const currentIds = (fileResult.data.playlists || []).map((p: any) => p.id);
  const newIds = currentIds.filter(
    (id: number) => id !== parseInt(playlistId)
  );

  await apiFetch(`/station/${STATION_ID}/file/${songId}`, {
    method: "PUT",
    body: JSON.stringify({ playlists: newIds }),
  });
}

export async function getStreamers(): Promise<Streamer[]> {
  const result = await apiFetch<any>(`/station/${STATION_ID}/streamers`);
  if (result.ok && Array.isArray(result.data)) {
    return result.data.map(mapStreamer);
  }
  return FALLBACK_STREAMERS;
}

export async function createStreamer(data: {
  displayName: string;
  username: string;
  password: string;
}): Promise<Streamer> {
  const result = await apiFetch<any>(`/station/${STATION_ID}/streamers`, {
    method: "POST",
    body: JSON.stringify({
      display_name: data.displayName,
      streamer_username: data.username,
      streamer_password: data.password,
    }),
  });
  if (result.ok && result.data) {
    return mapStreamer(result.data);
  }
  throw new Error("Failed to create streamer");
}

export async function updateStreamer(
  id: string,
  data: Partial<Streamer>
): Promise<Streamer> {
  const result = await apiFetch<any>(`/station/${STATION_ID}/streamers/${id}`, {
    method: "PUT",
    body: JSON.stringify({
      display_name: data.displayName,
      streamer_username: data.username,
    }),
  });
  if (result.ok && result.data) {
    return mapStreamer(result.data);
  }
  throw new Error("Failed to update streamer");
}

export async function deleteStreamer(id: string): Promise<void> {
  await apiFetch(`/station/${STATION_ID}/streamers/${id}`, {
    method: "DELETE",
  });
}

export async function getAnalytics(): Promise<AnalyticsReport> {
  return {
    totalListeners: { today: 0, week: 0, month: 0 },
    peakConcurrent: 0,
    listenersOverTime: [],
    topSongs: [],
    broadcastHistory: [],
  };
}

export async function getSongHistory(limit = 50): Promise<SongHistoryItem[]> {
  const result = await apiFetch<any[]>(`/station/${STATION_ID}/history`, {
    cache: "no-store",
  });
  if (result.ok && Array.isArray(result.data)) {
    return result.data.slice(0, limit).map((h: any) => ({
      song: {
        title: h.song?.title || "Unknown",
        artist: h.song?.artist || "",
        albumArt: h.song?.art || "",
      },
      playedAt: h.played_at
        ? new Date(h.played_at * 1000).toISOString()
        : "",
      duration: h.duration || 0,
    }));
  }
  return [];
}

export async function getListenerDetails(): Promise<any[]> {
  const result = await apiFetch<any[]>(`/station/${STATION_ID}/listeners`);
  if (result.ok && Array.isArray(result.data)) {
    return result.data;
  }
  return [];
}

function mapWebhook(raw: any): Webhook {
  const config = raw.config || {};
  return {
    id: String(raw.id),
    name: raw.name || undefined,
    url: config.webhook_url || config.url || "",
    events: raw.triggers || [],
    enabled: raw.is_enabled ?? true,
    secret: config.secret || "",
  };
}

export async function getWebhooks(): Promise<Webhook[]> {
  const result = await apiFetch<any[]>(`/station/${STATION_ID}/webhooks`);
  if (result.ok && Array.isArray(result.data)) {
    return result.data.map(mapWebhook);
  }
  return [];
}

export async function createWebhook(
  data: Partial<Webhook>
): Promise<Webhook> {
  const body: Record<string, any> = {
    webhook_url: data.url || "",
    triggers: data.events || [],
    type: "generic",
  };
  if (data.name) body.name = data.name;
  const result = await apiFetch<any>(`/station/${STATION_ID}/webhooks`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (result.ok && result.data) {
    return mapWebhook(result.data);
  }
  throw new Error("Failed to create webhook");
}

export async function updateWebhook(
  id: string,
  data: Partial<Webhook>
): Promise<Webhook> {
  const body: Record<string, any> = {};
  if (data.url !== undefined) body.webhook_url = data.url;
  if (data.events !== undefined) body.triggers = data.events;
  if (data.enabled !== undefined) body.is_enabled = data.enabled;
  if (data.name !== undefined) body.name = data.name;
  const result = await apiFetch<any>(`/station/${STATION_ID}/webhook/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
  if (result.ok && result.data) {
    return mapWebhook(result.data);
  }
  throw new Error("Failed to update webhook");
}

export async function deleteWebhook(id: string): Promise<void> {
  await apiFetch(`/station/${STATION_ID}/webhook/${id}`, {
    method: "DELETE",
  });
}

export async function testWebhook(
  id: string
): Promise<{ success: boolean }> {
  const result = await apiFetch<any>(`/station/${STATION_ID}/webhook/${id}/test`, {
    method: "PUT",
  });
  return { success: result.ok };
}

export async function toggleWebhook(id: string): Promise<Webhook> {
  const result = await apiFetch<any>(`/station/${STATION_ID}/webhook/${id}/toggle`, {
    method: "PUT",
  });
  if (result.ok && result.data) {
    return mapWebhook(result.data);
  }
  throw new Error("Failed to toggle webhook");
}

export async function getSettings(): Promise<StationSettings> {
  const stationResult = await apiFetch<any>(`/station/${STATION_ID}`);
  const adminResult = await apiFetch<any>(`/admin/station/${STATION_ID}`);
  if (stationResult.ok && stationResult.data) {
    const s = stationResult.data;
    const a = adminResult.ok ? adminResult.data : {};
    const mountUrl = s.mounts?.[0]?.url || "";
    return {
      name: a.name ?? s.name ?? "Radio Station",
      streamUrl: s.listen_url || mountUrl,
      publicPageUrl: s.public_player_url || "",
      autoDJ: true,
      maxListeners: a.max_listeners ?? 500,
      defaultBitrate: s.mounts?.[0]?.bitrate ?? 128,
      publicPageVisible: a.enable_public_page ?? s.is_public ?? true,
      mountPoint: s.mounts?.[0]?.path || "/radio.mp3",
    };
  }
  return { ...FALLBACK_SETTINGS };
}

export async function updateSettings(
  data: Partial<StationSettings>
): Promise<StationSettings> {
  const body: Record<string, any> = {};
  if (data.name !== undefined) body.name = data.name;
  if (data.publicPageVisible !== undefined) body.enable_public_page = data.publicPageVisible;
  const result = await apiFetch<any>(
    `/admin/station/${STATION_ID}`,
    { method: "PUT", body: JSON.stringify(body) }
  );
  if (result.ok) {
    const current = await getSettings();
    return current;
  }
  throw new Error("Failed to update settings");
}

export interface StationSourceInfo {
  sourcePassword: string;
  sourcePort: number;
  streamerPassword: string;
  djPort: number;
  djMountPoint: string;
  mountPoint: string;
  sourceUrl: string;
  serverAddress: string;
  djSourceUrl: string;
  djServerAddress: string;
  serverHost: string;
}

export async function getStationSourceInfo(): Promise<StationSourceInfo> {
  const adminResult = await apiFetch<any>(`/admin/station/${STATION_ID}`);
  const stationResult = await apiFetch<any>(`/station/${STATION_ID}`);

  let sourcePassword = "changeme";
  let streamerPassword = "changeme";
  let sourcePort = 9100;
  let djPort = 9105;
  let djMountPoint = "/";
  let mountPoint = "/radio.mp3";
  let serverHost = "azuracast.histoview.co.ke";

  if (adminResult.ok && adminResult.data) {
    const a = adminResult.data;
    const fc = a.frontend_config || {};
    const bc = a.backend_config || {};
    sourcePassword = fc.source_pw || "changeme";
    streamerPassword = fc.streamer_pw || "changeme";
    sourcePort = fc.port || 9100;
    djPort = bc.dj_port || 9105;
    djMountPoint = bc.dj_mount_point || "/";
  }

  if (stationResult.ok && stationResult.data) {
    const s = stationResult.data;
    mountPoint = s.mounts?.[0]?.path || "/radio.mp3";
    if (s.listen_url) {
      try { serverHost = new URL(s.listen_url).hostname; } catch {}
    }
  }

  return {
    sourcePassword,
    sourcePort,
    streamerPassword,
    djPort,
    djMountPoint,
    mountPoint,
    sourceUrl: `http://${serverHost}:${sourcePort}${mountPoint}`,
    serverAddress: `${serverHost}:${sourcePort}`,
    djSourceUrl: `http://${serverHost}:${djPort}${djMountPoint}`,
    djServerAddress: `${serverHost}:${djPort}`,
    serverHost,
  };
}


