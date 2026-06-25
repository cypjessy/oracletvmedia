"use client";

import { useState, useEffect } from "react";
import { getPlaylists, createPlaylist, updatePlaylist, deletePlaylist, removeSongFromPlaylist, MOCK_FILES, addSongsToPlaylist, type Playlist } from "@/lib/azuracast";

interface Props {
  showToast: (title: string, message: string, type?: "success" | "error" | "info", duration?: number) => void;
}

type PlaylistType = "standard" | "scheduled" | "on_demand";
type PlaylistOrder = "shuffle" | "sequential";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function Playlists({ showToast }: Props) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createType, setCreateType] = useState<PlaylistType>("standard");
  const [createOrder, setCreateOrder] = useState<PlaylistOrder>("shuffle");
  const [createWeight, setCreateWeight] = useState(1);
  const [createDays, setCreateDays] = useState<number[]>([]);
  const [createStartTime, setCreateStartTime] = useState("08:00");
  const [createEndTime, setCreateEndTime] = useState("10:00");
  const [showSongPicker, setShowSongPicker] = useState(false);
  const [pickerTargetId, setPickerTargetId] = useState<string | null>(null);
  const [selectedSongs, setSelectedSongs] = useState<Set<string>>(new Set());

  useEffect(() => { getPlaylists().then(setPlaylists); }, []);

  const toggleDay = (d: number) => {
    setCreateDays((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]);
  };

  const handleCreate = async () => {
    if (!createName.trim()) { showToast("Error", "Please enter a playlist name", "error"); return; }
    const newPl = await createPlaylist({
      name: createName,
      type: createType,
      order: createOrder,
      weight: createWeight,
      schedule: createType === "scheduled" ? { days: createDays, startTime: createStartTime, endTime: createEndTime } : undefined,
    });
    setPlaylists((prev) => [...prev, newPl]);
    setShowCreate(false);
    setCreateName("");
    setCreateDays([]);
    showToast("Playlist Created", `"${newPl.name}" has been created`, "success", 2500);
  };

  const handleToggleEnabled = async (pl: Playlist) => {
    const updated = await updatePlaylist(pl.id, { enabled: !pl.enabled });
    setPlaylists((prev) => prev.map((p) => (p.id === pl.id ? { ...p, enabled: !p.enabled } : p)));
    showToast(updated.enabled ? "Playlist Enabled" : "Playlist Disabled", `"${pl.name}" ${updated.enabled ? "is now active" : "has been paused"}`, "info", 2000);
  };

  const handleDelete = async (pl: Playlist) => {
    await deletePlaylist(pl.id);
    setPlaylists((prev) => prev.filter((p) => p.id !== pl.id));
    if (expandedId === pl.id) setExpandedId(null);
    showToast("Playlist Deleted", `"${pl.name}" has been removed`, "success", 2500);
  };

  const handleRemoveSong = async (plId: string, songId: string) => {
    await removeSongFromPlaylist(plId, songId);
    setPlaylists((prev) => prev.map((p) => p.id === plId ? { ...p, songs: p.songs.filter((s) => s !== songId), songCount: p.songCount - 1 } : p));
    showToast("Song Removed", "Removed from playlist", "info", 1500);
  };

  const handleOpenSongPicker = (plId: string) => {
    setPickerTargetId(plId);
    setSelectedSongs(new Set());
    setShowSongPicker(true);
  };

  const handleAddSongs = async () => {
    if (!pickerTargetId || selectedSongs.size === 0) return;
    await addSongsToPlaylist(pickerTargetId, Array.from(selectedSongs));
    setPlaylists((prev) => prev.map((p) => p.id === pickerTargetId ? { ...p, songs: [...p.songs, ...Array.from(selectedSongs)], songCount: p.songCount + selectedSongs.size } : p));
    showToast("Songs Added", `${selectedSongs.size} songs added to playlist`, "success", 2500);
    setShowSongPicker(false);
    setPickerTargetId(null);
  };

  const getTypeBadge = (type: PlaylistType) => {
    const map: Record<PlaylistType, { label: string; cls: string }> = {
      standard: { label: "Standard", cls: "blue" },
      scheduled: { label: "Scheduled", cls: "gold" },
      on_demand: { label: "On Demand", cls: "purple" },
    };
    return map[type];
  };

  const getSong = (id: string) => MOCK_FILES.find((f) => f.id === id);

  return (
    <>
      <style>{`
        .rs-pl { display: flex; flex-direction: column; gap: 12px; }
        .rs-pl-card { background: var(--rs-surface-card); border: 1px solid var(--rs-border); border-radius: var(--rs-radius-lg); overflow: hidden; transition: all 0.2s ease; }
        .rs-pl-card-header { display: flex; align-items: center; gap: 14px; padding: 14px; cursor: pointer; transition: all 0.15s ease; }
        .rs-pl-card-header:active { background: var(--rs-surface-elevated); }
        .rs-pl-icon { width: 36px; height: 36px; border-radius: var(--rs-radius-sm); display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }
        .rs-pl-icon.standard { background: rgba(59,130,246,0.12); color: var(--rs-grad-blue); }
        .rs-pl-icon.scheduled { background: rgba(232,168,56,0.12); color: var(--rs-primary); }
        .rs-pl-icon.on_demand { background: rgba(139,92,246,0.12); color: var(--rs-grad-purple); }
        .rs-pl-info { flex: 1; min-width: 0; }
        .rs-pl-name { font-size: 15px; font-weight: 600; display: flex; align-items: center; gap: 8px; }
        .rs-pl-meta { font-size: 12px; color: var(--rs-text-tertiary); margin-top: 2px; }
        .rs-pl-card-body { border-top: 1px solid var(--rs-border); padding: 12px 14px; background: var(--rs-bg); animation: rsFadeUp 0.2s ease; }
        .rs-pl-song { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid var(--rs-border); }
        .rs-pl-song:last-child { border-bottom: none; }
        .rs-pl-song-icon { width: 28px; height: 28px; border-radius: 6px; background: var(--rs-surface-elevated); display: flex; align-items: center; justify-content: center; font-size: 11px; color: var(--rs-text-tertiary); flex-shrink: 0; }
        .rs-pl-song-info { flex: 1; min-width: 0; }
        .rs-pl-song-title { font-size: 13px; font-weight: 600; }
        .rs-pl-song-artist { font-size: 11px; color: var(--rs-text-secondary); }
        .rs-pl-song-remove { width: 26px; height: 26px; border-radius: 50%; background: none; border: none; color: var(--rs-text-tertiary); font-size: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
        .rs-pl-song-remove:hover { color: var(--rs-error); background: rgba(239,68,68,0.1); }

        .rs-pl-form { background: var(--rs-surface-card); border: 1px solid var(--rs-border); border-radius: var(--rs-radius-lg); padding: 18px; display: flex; flex-direction: column; gap: 14px; animation: rsFadeUp 0.25s ease; }
        .rs-pl-form-title { font-size: 16px; font-weight: 700; }
        .rs-pl-form-row { display: flex; gap: 12px; }
        .rs-pl-form-row > * { flex: 1; }
        .rs-pl-days { display: flex; gap: 6px; }
        .rs-pl-day-btn { padding: 6px 10px; border-radius: 8px; font-size: 11px; font-weight: 600; border: 1.5px solid var(--rs-border); background: var(--rs-surface); color: var(--rs-text-secondary); cursor: pointer; transition: all 0.2s ease; }
        .rs-pl-day-btn.active { background: linear-gradient(135deg, var(--rs-grad-start), var(--rs-grad-end)); border-color: transparent; color: #fff; }
        .rs-pl-form-actions { display: flex; gap: 10px; justify-content: flex-end; }

        .rs-pl-picker-overlay { position: fixed; inset: 0; background: var(--rs-overlay); z-index: 9000; }
        .rs-pl-picker { position: fixed; bottom: 0; left: 0; right: 0; z-index: 9001; max-width: 480px; margin: 0 auto; background: var(--rs-surface); border-radius: 28px 28px 0 0; max-height: 75vh; display: flex; flex-direction: column; animation: rsFadeUp 0.35s ease; }
        .rs-pl-picker-handle { width: 40px; height: 5px; background: var(--rs-text-tertiary); border-radius: 3px; margin: 12px auto 8px; opacity: 0.5; }
        .rs-pl-picker-header { padding: 8px 24px 16px; text-align: center; }
        .rs-pl-picker-header h2 { font-size: 18px; font-weight: 700; }
        .rs-pl-picker-body { flex: 1; overflow-y: auto; padding: 0 24px 20px; }
        .rs-pl-picker-item { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid var(--rs-border); cursor: pointer; }
        .rs-pl-picker-item:active { opacity: 0.6; }
        .rs-pl-picker-cb { width: 20px; height: 20px; border-radius: 6px; border: 2px solid var(--rs-border); display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all 0.2s ease; }
        .rs-pl-picker-cb.checked { background: var(--rs-primary); border-color: var(--rs-primary); }
        .rs-pl-picker-cb i { font-size: 10px; color: #fff; }
        .rs-pl-picker-info { flex: 1; min-width: 0; }
        .rs-pl-picker-title { font-size: 14px; font-weight: 600; }
        .rs-pl-picker-artist { font-size: 12px; color: var(--rs-text-secondary); }
        .rs-pl-picker-footer { padding: 12px 24px calc(12px + env(safe-area-inset-bottom, 0px)); border-top: 1px solid var(--rs-border); }
      `}</style>

      <div className="rs-pl">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3 style={{ fontSize: 18, fontWeight: 700 }}>Playlists</h3>
          <button className="rs-btn-primary" onClick={() => setShowCreate(!showCreate)}>
            <i className="fas fa-plus"></i> {showCreate ? "Cancel" : "Create Playlist"}
          </button>
        </div>

        {/* Create Form */}
        {showCreate && (
          <div className="rs-pl-form">
            <div className="rs-pl-form-title">New Playlist</div>
            <div className="rs-pl-form-row">
              <div className="rs-gl-field" style={{ flex: 1 }}>
                <div className="rs-gl-label">Name</div>
                <input className="rs-input" placeholder="e.g. Sunday Morning" value={createName} onChange={(e) => setCreateName(e.target.value)} />
              </div>
            </div>
            <div className="rs-pl-form-row">
              <div className="rs-gl-field">
                <div className="rs-gl-label">Type</div>
                <select className="rs-select" value={createType} onChange={(e) => setCreateType(e.target.value as PlaylistType)}>
                  <option value="standard">Standard Rotation</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="on_demand">On Demand</option>
                </select>
              </div>
              <div className="rs-gl-field">
                <div className="rs-gl-label">Order</div>
                <select className="rs-select" value={createOrder} onChange={(e) => setCreateOrder(e.target.value as PlaylistOrder)}>
                  <option value="shuffle">Shuffle</option>
                  <option value="sequential">Sequential</option>
                </select>
              </div>
              <div className="rs-gl-field">
                <div className="rs-gl-label">Weight</div>
                <input type="number" className="rs-input" value={createWeight} onChange={(e) => setCreateWeight(Math.max(1, parseInt(e.target.value) || 1))} min={1} />
              </div>
            </div>
            {createType === "scheduled" && (
              <>
                <div className="rs-gl-field">
                  <div className="rs-gl-label">Days of Week</div>
                  <div className="rs-pl-days">
                    {DAY_NAMES.map((d, i) => (
                      <button key={i} className={`rs-pl-day-btn ${createDays.includes(i) ? "active" : ""}`} onClick={() => toggleDay(i)}>{d}</button>
                    ))}
                  </div>
                </div>
                <div className="rs-pl-form-row">
                  <div className="rs-gl-field">
                    <div className="rs-gl-label">Start Time</div>
                    <input type="time" className="rs-input" value={createStartTime} onChange={(e) => setCreateStartTime(e.target.value)} />
                  </div>
                  <div className="rs-gl-field">
                    <div className="rs-gl-label">End Time</div>
                    <input type="time" className="rs-input" value={createEndTime} onChange={(e) => setCreateEndTime(e.target.value)} />
                  </div>
                </div>
              </>
            )}
            <div className="rs-pl-form-actions">
              <button className="rs-btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="rs-btn-primary" onClick={handleCreate}>Create Playlist</button>
            </div>
          </div>
        )}

        {/* Playlist List */}
        {playlists.length === 0 ? (
          <div className="rs-empty">
            <i className="fas fa-list"></i>
            <h4>No playlists yet</h4>
            <p>Create your first playlist to organize media for AutoDJ</p>
          </div>
        ) : (
          playlists.map((pl) => {
            const badge = getTypeBadge(pl.type);
            const isExpanded = expandedId === pl.id;
            return (
              <div className="rs-pl-card" key={pl.id}>
                <div className="rs-pl-card-header" onClick={() => setExpandedId(isExpanded ? null : pl.id)}>
                  <div className={`rs-pl-icon ${pl.type}`}><i className="fas fa-list"></i></div>
                  <div className="rs-pl-info">
                    <div className="rs-pl-name">
                      {pl.name}
                      <span className={`rs-badge ${badge.cls}`}>{badge.label}</span>
                    </div>
                    <div className="rs-pl-meta">
                      {pl.songCount} songs · {pl.order} · Weight {pl.weight}
                      {pl.schedule && ` · ${pl.schedule.days.map((d) => DAY_NAMES[d]).join(", ")} ${pl.schedule.startTime}-${pl.schedule.endTime}`}
                    </div>
                  </div>
                  <button
                    className={`rs-toggle ${pl.enabled ? "active" : ""}`}
                    onClick={(e) => { e.stopPropagation(); handleToggleEnabled(pl); }}
                  ></button>
                </div>
                {isExpanded && (
                  <div className="rs-pl-card-body">
                    {pl.songs.length === 0 ? (
                      <div className="rs-empty" style={{ padding: "20px 0" }}>
                        <h4>No songs</h4>
                        <p>Add songs to this playlist</p>
                      </div>
                    ) : (
                      pl.songs.map((songId) => {
                        const song = getSong(songId);
                        return (
                          <div className="rs-pl-song" key={songId}>
                            <div className="rs-pl-song-icon"><i className="fas fa-grip-vertical" style={{ cursor: "grab" }}></i></div>
                            <div className="rs-pl-song-icon"><i className="fas fa-music"></i></div>
                            <div className="rs-pl-song-info">
                              <div className="rs-pl-song-title">{song?.title || "Unknown"}</div>
                              <div className="rs-pl-song-artist">{song?.artist || ""}</div>
                            </div>
                            <span style={{ fontSize: 11, color: "var(--rs-text-tertiary)" }}>{song?.duration || ""}</span>
                            <button className="rs-pl-song-remove" onClick={() => handleRemoveSong(pl.id, songId)}>
                              <i className="fas fa-xmark"></i>
                            </button>
                          </div>
                        );
                      })
                    )}
                    <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                      <button className="rs-btn-secondary" style={{ padding: "6px 12px", fontSize: 12 }} onClick={() => handleOpenSongPicker(pl.id)}>
                        <i className="fas fa-plus"></i> Add Songs
                      </button>
                      <button className="rs-btn-danger" style={{ padding: "6px 12px", fontSize: 12 }} onClick={() => handleDelete(pl)}>
                        <i className="fas fa-trash-can"></i> Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Song Picker Modal */}
        {showSongPicker && (
          <>
            <div className="rs-pl-picker-overlay" onClick={() => setShowSongPicker(false)}></div>
            <div className="rs-pl-picker">
              <div className="rs-pl-picker-handle"></div>
              <div className="rs-pl-picker-header">
                <h2>Add Songs</h2>
              </div>
              <div className="rs-pl-picker-body">
                {MOCK_FILES.map((f) => (
                  <div className="rs-pl-picker-item" key={f.id} onClick={() => {
                    setSelectedSongs((prev) => {
                      const next = new Set(prev);
                      if (next.has(f.id)) next.delete(f.id); else next.add(f.id);
                      return next;
                    });
                  }}>
                    <div className={`rs-pl-picker-cb ${selectedSongs.has(f.id) ? "checked" : ""}`}>
                      {selectedSongs.has(f.id) && <i className="fas fa-check"></i>}
                    </div>
                    <div className="rs-pl-picker-info">
                      <div className="rs-pl-picker-title">{f.title}</div>
                      <div className="rs-pl-picker-artist">{f.artist} · {f.album}</div>
                    </div>
                    <span style={{ fontSize: 11, color: "var(--rs-text-tertiary)" }}>{f.duration}</span>
                  </div>
                ))}
              </div>
              <div className="rs-pl-picker-footer">
                <button
                  className="rs-btn-primary"
                  style={{ width: "100%" }}
                  onClick={handleAddSongs}
                  disabled={selectedSongs.size === 0}
                >
                  Add {selectedSongs.size > 0 ? `${selectedSongs.size} Song${selectedSongs.size !== 1 ? "s" : ""}` : "Songs"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
